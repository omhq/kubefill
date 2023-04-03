//go:build !windows

package runner

import (
	"bytes"
	"context"
	"io"
	"net"
	"os"
	"os/exec"
	"runtime"
	"testing"
	"time"

	runnerv1 "github.com/kubefill/kubefill/mdx/gen/proto/go/runme/runner/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
	"google.golang.org/protobuf/proto"
)

func testCreateLogger(t *testing.T) *zap.Logger {
	logger, err := zap.NewDevelopment()
	require.NoError(t, err)
	t.Cleanup(func() { _ = logger.Sync() })
	return logger
}

func testStartRunnerServiceServer(t *testing.T) (
	interface{ Dial() (net.Conn, error) },
	func(),
) {
	logger, err := zap.NewDevelopment()
	require.NoError(t, err)
	lis := bufconn.Listen(1024 << 10)
	server := grpc.NewServer()
	runnerService, err := newRunnerService(logger)
	require.NoError(t, err)
	runnerv1.RegisterRunnerServiceServer(server, runnerService)
	go server.Serve(lis)
	return lis, server.Stop
}

func testCreateRunnerServiceClient(
	t *testing.T,
	lis interface{ Dial() (net.Conn, error) },
) (*grpc.ClientConn, runnerv1.RunnerServiceClient) {
	conn, err := grpc.Dial(
		"",
		grpc.WithContextDialer(func(ctx context.Context, s string) (net.Conn, error) {
			return lis.Dial()
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	require.NoError(t, err)
	return conn, runnerv1.NewRunnerServiceClient(conn)
}

type executeResult struct {
	Stdout   []byte
	Stderr   []byte
	ExitCode int
	Err      error
}

func getExecuteResult(
	stream runnerv1.RunnerService_ExecuteClient,
	resultc chan<- executeResult,
) {
	var result executeResult

	for {
		r, rerr := stream.Recv()
		if rerr != nil {
			if rerr == io.EOF {
				rerr = nil
			}
			result.Err = rerr
			break
		}
		result.Stdout = append(result.Stdout, r.StdoutData...)
		result.Stderr = append(result.Stderr, r.StderrData...)
		if r.ExitCode != nil {
			result.ExitCode = int(r.ExitCode.Value)
		}
	}

	resultc <- result
}

func Test_runnerService(t *testing.T) {
	t.Parallel()

	lis, stop := testStartRunnerServiceServer(t)
	t.Cleanup(stop)
	_, client := testCreateRunnerServiceClient(t, lis)

	t.Run("Sessions", func(t *testing.T) {
		t.Parallel()

		envs := []string{"TEST_OLD=value1"}
		createSessResp, err := client.CreateSession(
			context.Background(),
			&runnerv1.CreateSessionRequest{Envs: envs},
		)
		require.NoError(t, err)
		assert.NotEmpty(t, createSessResp.Session.Id)
		assert.EqualValues(t, envs, createSessResp.Session.Envs)

		getSessResp, err := client.GetSession(
			context.Background(),
			&runnerv1.GetSessionRequest{Id: createSessResp.Session.Id},
		)
		require.NoError(t, err)
		assert.True(t, proto.Equal(createSessResp.Session, getSessResp.Session))

		_, err = client.DeleteSession(
			context.Background(),
			&runnerv1.DeleteSessionRequest{Id: getSessResp.Session.Id},
		)
		assert.NoError(t, err)

		_, err = client.DeleteSession(
			context.Background(),
			&runnerv1.DeleteSessionRequest{Id: "non-existent"},
		)
		assert.Equal(t, status.Convert(err).Code(), codes.NotFound)
	})

	t.Run("ExecuteBasic", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Commands:    []string{"echo 1", "sleep 1", "echo 2"},
		})
		assert.NoError(t, err)

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.Equal(t, "1\n2\n", string(result.Stdout))
		assert.EqualValues(t, 0, result.ExitCode)
	})

	t.Run("ExecuteWithTTYBasic", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         true,
			Commands:    []string{"echo 1", "sleep 1", "echo 2"},
		})
		assert.NoError(t, err)

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.Equal(t, "1\r\n2\r\n", string(result.Stdout))
		assert.EqualValues(t, 0, result.ExitCode)
	})

	t.Run("Input", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         true,
			Commands:    []string{"tr a-z x"},
		})
		require.NoError(t, err)

		errc := make(chan error)
		go func() {
			defer close(errc)
			time.Sleep(time.Second)
			err := stream.Send(&runnerv1.ExecuteRequest{
				InputData: []byte("abc\n"),
			})
			errc <- err
			time.Sleep(time.Second)
			err = stream.Send(&runnerv1.ExecuteRequest{
				InputData: []byte{4},
			})
			errc <- err
		}()
		for err := range errc {
			assert.NoError(t, err)
		}
		assert.NoError(t, stream.CloseSend())

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.Equal(t, "xxx\r\n", string(result.Stdout))
		assert.EqualValues(t, 0, result.ExitCode)
	})

	// The longest accepted line must not have more than 1024 bytes on macOS,
	// including the new line character at the end. Any line longer results in ^G (BELL).
	// It is possible to send more data, but it must be divided in 1024-byte chunks
	// separated by the new line character (\n).
	// More: https://man.freebsd.org/cgi/man.cgi?query=termios&sektion=4
	// On Linux, the limit is 4096 which is described on the termios man page.
	// More: https://man7.org/linux/man-pages/man3/termios.3.html
	if runtime.GOOS == "linux" {
		t.Run("LargeInput", func(t *testing.T) {
			t.Parallel()

			stream, err := client.Execute(context.Background())
			require.NoError(t, err)

			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)

			err = stream.Send(&runnerv1.ExecuteRequest{
				ProgramName: "bash",
				Tty:         true,
				Commands:    []string{"tr a-z x"},
			})
			require.NoError(t, err)

			errc := make(chan error)
			go func() {
				defer close(errc)

				data := make([]byte, 4096)
				for i := 0; i < len(data); i++ {
					data[i] = 'a'
				}
				data[len(data)-1] = '\n'

				time.Sleep(time.Second)
				err := stream.Send(&runnerv1.ExecuteRequest{
					InputData: data,
				})
				errc <- err
				time.Sleep(time.Second)
				err = stream.Send(&runnerv1.ExecuteRequest{
					InputData: []byte{4},
				})
				errc <- err
			}()
			for err := range errc {
				assert.NoError(t, err)
			}
			assert.NoError(t, stream.CloseSend())

			result := <-execResult

			assert.NoError(t, result.Err)
			assert.Len(t, result.Stdout, 4097) // \n => \r\n
			assert.EqualValues(t, 0, result.ExitCode)
		})
	}

	t.Run("EnvsPersistence", func(t *testing.T) {
		t.Parallel()

		createSessResp, err := client.CreateSession(
			context.Background(),
			&runnerv1.CreateSessionRequest{
				Envs: []string{"SESSION=session1"},
			},
		)
		require.NoError(t, err)

		// First, execute using the session provided env variable SESSION.
		{
			stream, err := client.Execute(context.Background())
			require.NoError(t, err)

			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)

			err = stream.Send(&runnerv1.ExecuteRequest{
				SessionId:   createSessResp.Session.Id,
				Envs:        []string{"EXEC_PROVIDED=execute1"},
				ProgramName: "bash",
				Commands: []string{
					"echo $SESSION $EXEC_PROVIDED",
					"export EXEC_EXPORTED=execute2",
				},
			})
			require.NoError(t, err)

			result := <-execResult

			assert.NoError(t, result.Err)
			assert.Equal(t, "session1 execute1\n", string(result.Stdout))
			assert.EqualValues(t, 0, result.ExitCode)
		}

		// Execute again using the newly exported env EXEC_EXPORTED.
		{
			stream, err := client.Execute(context.Background())
			require.NoError(t, err)

			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)

			err = stream.Send(&runnerv1.ExecuteRequest{
				SessionId:   createSessResp.Session.Id,
				ProgramName: "bash",
				Commands: []string{
					"echo $EXEC_EXPORTED",
				},
			})
			require.NoError(t, err)

			result := <-execResult

			assert.NoError(t, result.Err)
			assert.Equal(t, "execute2\n", string(result.Stdout))
			assert.EqualValues(t, 0, result.ExitCode)
		}

		// Validate that the envs got persistent in the session.
		sessResp, err := client.GetSession(
			context.Background(),
			&runnerv1.GetSessionRequest{Id: createSessResp.Session.Id},
		)
		require.NoError(t, err)
		assert.EqualValues(
			t,
			// Session.Envs is sorted alphabetically
			[]string{"EXEC_EXPORTED=execute2", "EXEC_PROVIDED=execute1", "SESSION=session1"},
			sessResp.Session.Envs,
		)
	})

	t.Run("ExecuteWithTTYCloseSendDirection", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         true,
			Commands:    []string{"sleep 1"},
		})
		assert.NoError(t, err)
		assert.NoError(t, stream.CloseSend())

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.EqualValues(t, 0, result.ExitCode)
	})

	t.Run("ExecuteWithTTYSendEOT", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         true, // without TTY it won't work
			Commands:    []string{"sleep 30"},
		})
		assert.NoError(t, err)

		errc := make(chan error)
		go func() {
			defer close(errc)
			time.Sleep(time.Second)
			err := stream.Send(&runnerv1.ExecuteRequest{
				InputData: []byte{3},
			})
			errc <- err
		}()
		for err := range errc {
			assert.NoError(t, err)
		}

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.EqualValues(t, 130, result.ExitCode)
	})

	// ExecuteClientCancel is similar to "ExecuteCloseSendDirection" but the client cancels
	// the connection. When running wihout TTY, this and sending ExecuteRequest.stop are
	// the only ways to interrupt a program.
	t.Run("ExecuteClientCancel", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		stream, err := client.Execute(ctx)
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Commands:    []string{"sleep 30"},
		})
		assert.NoError(t, err)

		// Cancel instead of cleanly exiting the command on the server.
		go func() {
			time.Sleep(time.Second)
			cancel()
		}()

		result := <-execResult

		assert.Equal(t, status.Convert(result.Err).Code(), codes.Canceled)
	})

	// This test simulates a situation when a client starts a program
	// with TTY and does not know when it exists. The program should
	// return on its own after the command is done.
	t.Run("ExecuteWithTTYExitSuccess", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		stream, err := client.Execute(ctx)
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         true,
			Commands:    []string{"sleep 1"},
		})
		assert.NoError(t, err)

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.EqualValues(t, 0, result.ExitCode)
	})

	t.Run("ExecuteExitSuccess", func(t *testing.T) {
		t.Parallel()

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		stream, err := client.Execute(ctx)
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         false,
			Commands:    []string{"sleep 1"},
		})
		assert.NoError(t, err)

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.EqualValues(t, 0, result.ExitCode)
	})

	if _, err := exec.LookPath("python3"); err == nil {
		t.Run("ExecutePythonServer", func(t *testing.T) {
			t.Parallel()

			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			stream, err := client.Execute(ctx)
			require.NoError(t, err)

			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)

			err = stream.Send(&runnerv1.ExecuteRequest{
				ProgramName: "bash",
				Tty:         true,
				Commands:    []string{"python3 -m http.server 0"},
			})
			assert.NoError(t, err)

			errc := make(chan error)
			go func() {
				defer close(errc)
				time.Sleep(time.Second)
				err := stream.Send(&runnerv1.ExecuteRequest{
					InputData: []byte{3},
				})
				errc <- err
			}()
			for err := range errc {
				assert.NoError(t, err)
			}

			result := <-execResult

			assert.NoError(t, result.Err)
			assert.EqualValues(t, 0, result.ExitCode)
		})
	}

	t.Run("ExecuteSendRequestStop", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Tty:         false, // no TTY; only way to interrupt it is to send ExecuteRequest.stop or cancel the stream
			Commands:    []string{"sleep 30"},
		})
		assert.NoError(t, err)

		errc := make(chan error)
		go func() {
			defer close(errc)
			time.Sleep(time.Second)
			err := stream.Send(&runnerv1.ExecuteRequest{
				Stop: runnerv1.ExecuteStop_EXECUTE_STOP_INTERRUPT,
			})
			errc <- err
		}()
		for err := range errc {
			assert.NoError(t, err)
		}

		result := <-execResult

		assert.NoError(t, result.Err)
		assert.EqualValues(t, 130, result.ExitCode)
	})

	t.Run("ExecuteMultilineEnvExport", func(t *testing.T) {
		t.Parallel()

		session, err := client.CreateSession(context.Background(), &runnerv1.CreateSessionRequest{})
		require.NoError(t, err)

		sessionID := session.Session.Id

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Directory:   "../..",
			Commands: []string{
				"export LICENSE=$(cat LICENSE)",
			},
			SessionId: sessionID,
		})
		require.NoError(t, err)

		{
			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)
			result := <-execResult
			require.EqualValues(t, 0, result.ExitCode)
		}

		_, _ = client.GetSession(context.Background(), &runnerv1.GetSessionRequest{
			Id: sessionID,
		})

		stream, err = client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Directory:   "../..",
			Commands: []string{
				"echo \"LICENSE: $LICENSE\"",
			},
			SessionId: sessionID,
		})
		assert.NoError(t, err)

		result := <-execResult

		assert.NoError(t, result.Err)
		expected, err := os.ReadFile("../../LICENSE")
		require.NoError(t, err)
		assert.Equal(t, "LICENSE: "+string(expected), string(result.Stdout))
		assert.EqualValues(t, 0, result.ExitCode)
	})

	t.Run("ExecuteWinsizeDefault", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Commands: []string{
				"tput lines -T linux",
				"tput cols -T linux",
			},
			Tty: true,
		})
		require.NoError(t, err)

		result := <-execResult
		assert.EqualValues(t, 0, result.ExitCode)
		assert.EqualValues(t, "24\r\n80\r\n", string(result.Stdout))
	})

	t.Run("ExecuteWinsizeSet", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Commands: []string{
				"tput lines -T linux",
				"tput cols -T linux",
			},
			Winsize: &runnerv1.Winsize{
				Cols: 200,
				Rows: 64,
			},
			Tty: true,
		})
		require.NoError(t, err)

		result := <-execResult
		assert.EqualValues(t, 0, result.ExitCode)
		assert.EqualValues(t, "64\r\n200\r\n", string(result.Stdout))
	})

	t.Run("ExecuteWinsizeChange", func(t *testing.T) {
		t.Parallel()

		stream, err := client.Execute(context.Background())
		require.NoError(t, err)

		execResult := make(chan executeResult)
		go getExecuteResult(stream, execResult)

		err = stream.Send(&runnerv1.ExecuteRequest{
			ProgramName: "bash",
			Commands: []string{
				"read",
				"tput lines -T linux",
				"tput cols -T linux",
			},
			Tty: true,
		})
		require.NoError(t, err)

		stream.Send(&runnerv1.ExecuteRequest{
			Winsize: &runnerv1.Winsize{
				Cols: 150,
				Rows: 56,
			},
		})

		stream.Send(&runnerv1.ExecuteRequest{
			InputData: []byte("\n"),
		})

		result := <-execResult
		assert.EqualValues(t, 0, result.ExitCode)
		assert.EqualValues(t, "56\r\n150\r\n", string(result.Stdout))
	})

	t.Run("ExecuteSessionsMostRecent", func(t *testing.T) {
		ctx := context.Background()

		createSession := func(id string) string {
			resp, err := client.CreateSession(ctx, &runnerv1.CreateSessionRequest{
				Envs: []string{
					// fmt.Sprint("SESSION_NUM=%s", id),
					"SESSION_NUM=" + id,
				},
			})
			require.NoError(t, err)
			return resp.Session.Id
		}

		getSessionNum := func(sessionId string) string {
			stream, err := client.Execute(context.Background())
			require.NoError(t, err)

			execResult := make(chan executeResult)
			go getExecuteResult(stream, execResult)

			strategy := runnerv1.SessionStrategy_SESSION_STRATEGY_MOST_RECENT

			if sessionId != "" {
				strategy = runnerv1.SessionStrategy_SESSION_STRATEGY_UNSPECIFIED
			}

			err = stream.Send(&runnerv1.ExecuteRequest{
				ProgramName:     "bash",
				SessionId:       sessionId,
				SessionStrategy: strategy,
				Commands: []string{
					"echo $SESSION_NUM",
				},
			})

			require.NoError(t, err)

			result := <-execResult
			return string(result.Stdout)
		}

		session1 := createSession("1")
		session2 := createSession("2")
		session3 := createSession("3")

		// create pushes priority
		assert.Equal(t, "3\n", getSessionNum(""))

		// executing pushes priority
		assert.Equal(t, getSessionNum(session2), "2\n")
		assert.Equal(t, getSessionNum(""), "2\n")

		// deleting removes from stack
		client.DeleteSession(ctx, &runnerv1.DeleteSessionRequest{Id: session2})
		assert.Equal(t, getSessionNum(""), "3\n")
		client.DeleteSession(ctx, &runnerv1.DeleteSessionRequest{Id: session3})
		assert.Equal(t, getSessionNum(""), "1\n")

		// creates new session if empty
		client.DeleteSession(ctx, &runnerv1.DeleteSessionRequest{Id: session1})
		assert.Equal(t, getSessionNum(""), "\n")
	})
}

func Test_readLoop(t *testing.T) {
	const dataSize = 10 * 1024 * 1024

	stdout := make([]byte, dataSize)
	stderr := make([]byte, dataSize)
	results := make(chan output)
	stdoutN, stderrN := 0, 0

	done := make(chan struct{})
	go func() {
		for data := range results {
			stdoutN += len(data.Stdout)
			stderrN += len(data.Stderr)
		}
		close(done)
	}()

	err := readLoop(bytes.NewReader(stdout), bytes.NewReader(stderr), results)
	assert.NoError(t, err)
	close(results)
	<-done
	assert.Equal(t, dataSize, stdoutN)
	assert.Equal(t, dataSize, stderrN)
}
