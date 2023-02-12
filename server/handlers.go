package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/kubefill/kubefill/pkg/application"
	"github.com/kubefill/kubefill/pkg/client"
	"github.com/kubefill/kubefill/pkg/job"
	repoPkg "github.com/kubefill/kubefill/pkg/repo"
	"github.com/kubefill/kubefill/pkg/secret"
	"github.com/kubefill/kubefill/reposerver"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func (s *Server) apiRoot() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		switch r.Method {
		default:
			JSONError(rw, errorResp{Message: ""}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) reposHandler(service *repoPkg.Service) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		conn, err := grpc.Dial(s.ServerConfig.RepoServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))

		if err != nil {
			log.Errorln(err)
		}

		defer conn.Close()

		rp := reposerver.NewRepoServiceClient(conn)

		switch r.Method {
		case "GET":
			repos := service.List()
			reposBytes, err := json.Marshal(repos)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(reposBytes))
		case "POST":
			var newRepoPayload repoPkg.RepoCreate
			err := decodeJSONBody(rw, r, &newRepoPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			var newRepo repoPkg.Repo
			newRepo.Url = newRepoPayload.Url
			repo := service.Create(newRepo)

			if len(newRepoPayload.Ssh_Private_Key) > 0 {
				message := reposerver.SaveSshKeyRequest{SshKey: newRepoPayload.Ssh_Private_Key, RepoId: strconv.FormatInt(int64(repo.ID), 10)}
				_, err = rp.SaveSshKey(context.Background(), &message)
			}

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			newRepoBytes, err := json.Marshal(repo)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(newRepoBytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) repoHandler(repoService *repoPkg.Service) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		conn, err := grpc.Dial(s.ServerConfig.RepoServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))

		if err != nil {
			log.Errorln(err)
		}

		defer conn.Close()

		rp := reposerver.NewRepoServiceClient(conn)
		vars := mux.Vars(r)
		repoId := vars["id"]
		idAsUInt, err := strconv.ParseUint(repoId, 10, 32)

		if err != nil {
			log.Errorln(err)
		}

		switch r.Method {
		case "GET":
			repo, err := repoService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			repoBytes, err := json.Marshal(repo)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(repoBytes))
		case "POST":
			repo, err := repoService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			action := vars["action"]

			if action == "sync" {
				message := reposerver.SyncRequest{Repo: repo.Url, RepoId: strconv.FormatInt(int64(repo.ID), 10)}
				resp, err := rp.Sync(context.Background(), &message)

				if err != nil {
					JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
					return
				}

				repo.Commit = resp.Commit
				repo.Hash = resp.Hash
				repoService.Update(repo)
			}

			repoBytes, err := json.Marshal(repo)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(repoBytes))
		case "PUT":
			repo, err := repoService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			var updateRepoPayload repoPkg.RepoUpdate
			err = decodeJSONBody(rw, r, &updateRepoPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			repo.Url = updateRepoPayload.Url
			repoService.Update(repo)

			if len(updateRepoPayload.Ssh_Private_Key) > 0 {
				message := reposerver.SaveSshKeyRequest{SshKey: updateRepoPayload.Ssh_Private_Key, RepoId: strconv.FormatInt(int64(repo.ID), 10)}
				_, err = rp.SaveSshKey(context.Background(), &message)
			}

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			repoBytes, err := json.Marshal(repoPkg.Repo{
				Id:         int(repo.ID),
				Url:        repo.Url,
				Commit:     repo.Commit,
				Hash:       repo.Hash,
				Created_At: repo.CreatedAt.String(),
				Updated_At: repo.UpdatedAt.String(),
				Deleted_At: repo.DeletedAt.Time.String(),
			})

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(repoBytes))
		case "DELETE":
			repo, err := repoService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			err = repoService.Delete(repo)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			message := reposerver.RemoveSshKeyRequest{RepoId: strconv.FormatInt(int64(repo.ID), 10)}
			_, err = rp.RemoveSshKey(context.Background(), &message)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			http.Error(rw, "", http.StatusNoContent)
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) applicationHandler(applicationService *application.Service, repoService *repoPkg.Service) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		conn, err := grpc.Dial(s.ServerConfig.RepoServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))

		if err != nil {
			log.Errorln(err)
		}

		defer conn.Close()

		rp := reposerver.NewRepoServiceClient(conn)
		vars := mux.Vars(r)
		applicationID := vars["id"]
		idAsUInt, err := strconv.ParseUint(applicationID, 10, 32)
		resp := AppManifestHttpResp{}

		if err != nil {
			log.Errorln(err)
		}

		switch r.Method {
		case "GET":
			app, err := applicationService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			repo, err := repoService.Get(app.RepoID)

			if err != nil {
				log.Errorln(err)
			}

			if err == nil {
				repoDirRequest := reposerver.RepoDirRequest{RepoUrl: repo.Url}
				repoDirResponse, err := rp.GetRepoDir(context.Background(), &repoDirRequest)

				if err != nil {
					log.Errorln(err)
				}

				fullManifestPath := path.Join(repoDirResponse.Path, app.ManifestPath)
				message := reposerver.ManifestsRequest{Path: fullManifestPath}
				response, err := rp.GetManifests(context.Background(), &message)

				if err != nil {
					log.Errorln(err)
				}

				resp.Manifests = response
			}

			resp.App = app
			respBytes, err := json.Marshal(resp)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		case "PUT":
			app, err := applicationService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			var updateAppPayload application.ApplicationUpdate
			err = decodeJSONBody(rw, r, &updateAppPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			app.ManifestPath = updateAppPayload.ManifestPath
			app.RepoID = updateAppPayload.RepoID
			app.Name = updateAppPayload.Name
			applicationService.Update(app)

			repo, err := repoService.Get(app.RepoID)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			repoDirRequest := reposerver.RepoDirRequest{RepoUrl: repo.Url}
			repoDirResponse, err := rp.GetRepoDir(context.Background(), &repoDirRequest)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			fullManifestPath := path.Join(repoDirResponse.Path, app.ManifestPath)
			message := reposerver.ManifestsRequest{Path: fullManifestPath}
			response, err := rp.GetManifests(context.Background(), &message)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			resp.App = app
			resp.Manifests = response
			respBytes, err := json.Marshal(resp)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		case "DELETE":
			app, err := applicationService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			err = applicationService.Delete(app)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			http.Error(rw, "", http.StatusNoContent)
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) applicationsHandler(service *application.Service) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			apps := service.List()
			appsBytes, err := json.Marshal(apps)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(appsBytes))
		case "POST":
			var newAppPayload application.Application
			err := decodeJSONBody(rw, r, &newAppPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			newApp := service.Create(newAppPayload)
			newAppBytes, err := json.Marshal(newApp)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(newAppBytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) settingsHandler() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		conn, err := grpc.Dial(s.ServerConfig.RepoServerAddress, grpc.WithTransportCredentials(insecure.NewCredentials()))

		if err != nil {
			log.Errorln(err)
		}

		defer conn.Close()

		rp := reposerver.NewRepoServiceClient(conn)

		switch r.Method {
		case "GET":
			message := reposerver.PathsRequest{}
			paths, err := rp.GetPaths(context.Background(), &message)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			resp := SettingsHttpResponse{
				RepoRoot:   paths.RepoRoot,
				SshRoot:    paths.SshRoot,
				PrivateKey: paths.PrivateKey,
			}
			respBytes, err := json.Marshal(resp)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) logsHandler() http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			vars := mux.Vars(r)
			jobId := vars["id"]
			libRegEx, err := regexp.Compile(`^.+.(log)$`)

			if err != nil {
				log.Errorln(err)
			}

			logFiles := make(map[string]FileData)

			err = filepath.Walk(path.Join(s.ServerConfig.LogsPath, jobId), func(path string, info os.FileInfo, err error) error {
				if err == nil {
					fileName := info.Name()
					if libRegEx.MatchString(fileName) {
						_, _, ctime, err := statTimes(path)

						if err != nil {
							return err
						}

						logLines, err := readLines(path)

						if err != nil {
							return err
						}

						logFiles[fileName] = FileData{
							DateCreated: ctime,
							Path:        path,
							Logs:        logLines,
						}
					}
				}

				return nil
			})

			if err != nil {
				log.Errorln(err)
			}

			p := make(PairList, len(logFiles))
			i := 0

			for k, v := range logFiles {
				p[i] = Pair{k, v}
				i++
			}

			sort.Sort(p)
			bytes, _ := json.Marshal(p)
			io.WriteString(rw, string(bytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) applicationSecretsHandler(applicationService *application.Service, secretService *secret.SecretService) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appId, err := strconv.ParseUint(vars["id"], 10, 32)
		appIdUint := uint(appId)

		if err != nil {
			log.Errorln(err)
		}

		switch r.Method {
		case "GET":
			secrets, err := secretService.GetAllByAppId(appIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			var data []secret.SecretHttpResp

			for _, s := range secrets {
				data = append(data, secret.SecretHttpResp{
					Id:         s.ID,
					Name:       s.Name,
					Created_At: s.CreatedAt.Format(time.RFC3339Nano),
					Updated_At: s.UpdatedAt.Format(time.RFC3339Nano),
				})
			}

			secretsBytes, err := json.Marshal(data)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(secretsBytes))
		case "POST":
			var newSecretPayload secret.Secret
			err := decodeJSONBody(rw, r, &newSecretPayload)
			newSecretPayload.ApplicationID = appIdUint

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			encrypted, err := encrypt([]byte(s.SecretsKey), newSecretPayload.Value)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			newSecretPayload.Value = encrypted
			newSecret := secretService.Create(newSecretPayload)
			newSecretBytes, err := json.Marshal(secret.Secret{
				Id:         int(newSecret.ID),
				Name:       newSecret.Name,
				Created_At: newSecret.CreatedAt.Format(time.RFC3339Nano),
				Updated_At: newSecret.UpdatedAt.Format(time.RFC3339Nano),
			})

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(newSecretBytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) applicationSecretHandler(applicationService *application.Service, secretService *secret.SecretService) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		secretId, err := strconv.ParseUint(vars["secretId"], 10, 32)
		secretIdUint := uint(secretId)

		if err != nil {
			log.Errorln(err)
		}

		switch r.Method {
		case "GET":
			storedSecret, err := secretService.Get(secretIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			secretsBytes, err := json.Marshal(secret.SecretHttpResp{
				Id:         storedSecret.ID,
				Name:       storedSecret.Name,
				Created_At: storedSecret.CreatedAt.Format(time.RFC3339Nano),
				Updated_At: storedSecret.UpdatedAt.Format(time.RFC3339Nano),
			})

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(secretsBytes))
		case "PUT":
			storedSecret, err := secretService.Get(secretIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			var updateSecretPayload secret.SecretUpdate
			err = decodeJSONBody(rw, r, &updateSecretPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			encrypted, err := encrypt([]byte(s.SecretsKey), updateSecretPayload.Value)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			storedSecret.Name = updateSecretPayload.Name
			storedSecret.Value = encrypted

			secretService.Update(storedSecret)

			secretsBytes, err := json.Marshal(secret.SecretHttpResp{
				Id:         storedSecret.ID,
				Name:       storedSecret.Name,
				Created_At: storedSecret.CreatedAt.Format(time.RFC3339Nano),
				Updated_At: storedSecret.UpdatedAt.Format(time.RFC3339Nano),
			})

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(secretsBytes))
		case "DELETE":
			storedSecret, err := secretService.Get(secretIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			err = secretService.Delete(storedSecret)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			http.Error(rw, "", http.StatusNoContent)
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) applicationJobHandler(applicationService *application.Service, jobService *job.JobService, secretService *secret.SecretService) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		appId, _ := strconv.ParseUint(vars["id"], 10, 32)
		appIdUint := uint(appId)

		switch r.Method {
		case "GET":
			jobs, err := jobService.GetAllByAppId(appIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			respBytes, err := json.Marshal(jobs)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		case "POST":
			var jobPayload client.JobConfig
			decoder := json.NewDecoder(r.Body)
			err := decoder.Decode(&jobPayload)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			secretsMap := make(map[string]string)
			secrets, err := secretService.GetAllByAppId(appIdUint)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			for _, sc := range secrets {
				decrypted, err := decrypt([]byte(s.SecretsKey), sc.Value)

				if err != nil {
					JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
					return
				}

				secretsMap[sc.Name] = decrypted
			}

			randomString, err := GenerateRandomString(10)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			sp, _ := json.Marshal(jobPayload.Spec)
			spAsString := string(sp)
			reg := regexp.MustCompile(`{{([^}}]*)}}`)
			matches := reg.FindAllStringSubmatch(spAsString, -1)

			for _, v := range matches {
				matchValue := strings.ReplaceAll(v[1], "secrets.", "")
				keyVal, ok := secretsMap[matchValue]

				if ok {
					spAsString = strings.Replace(spAsString, v[0], keyVal, -1)
				} else {
					spAsString = strings.Replace(spAsString, v[0], "", -1)
				}
			}

			json.Unmarshal([]byte(spAsString), &jobPayload.Spec)

			jobName := fmt.Sprintf("%s-%s", jobPayload.ObjectMeta.Name, randomString)
			jobConfig := client.JobConfig{ObjectMeta: jobPayload.ObjectMeta, Spec: jobPayload.Spec}
			newJob := jobService.Create(job.Job{Name: jobName, ApplicationID: appIdUint})
			labels := make(map[string]string)

			labels["invoked"] = ""
			labels["job_id"] = strconv.FormatUint(uint64(newJob.ID), 10)

			jobConfig.Labels = labels
			resp, err := s.clientset.Run(jobName, jobConfig)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			spec, _ := json.Marshal(jobPayload.Spec)
			meta, _ := json.Marshal(jobPayload.ObjectMeta)
			newJob.Spec = spec
			newJob.Meta = meta
			jobService.Update(newJob)

			respBytes, err := json.Marshal(JobRunResponse{
				Job:    newJob,
				Config: jobConfig,
				Spec:   resp.Spec,
				Status: resp.Status,
			})

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) jobHandler(jobService *job.JobService) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			vars := mux.Vars(r)
			jobId := vars["id"]
			idAsUInt, err := strconv.ParseUint(jobId, 10, 32)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			job, err := jobService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			respBytes, err := json.Marshal(job)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			io.WriteString(rw, string(respBytes))
		case "DELETE":
			vars := mux.Vars(r)
			jobId := vars["id"]
			idAsUInt, err := strconv.ParseUint(jobId, 10, 32)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			app, err := jobService.Get(uint(idAsUInt))

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			err = jobService.Delete(app)

			if err != nil {
				JSONError(rw, errorResp{Message: err.Error()}, http.StatusInternalServerError)
				return
			}

			http.Error(rw, "", http.StatusNoContent)
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}

func (s *Server) wsHandler(hub *Hub) http.HandlerFunc {
	return func(rw http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case "GET":
			params := r.URL.Query()
			id := params.Get("id")
			conn, err := upgrader.Upgrade(rw, r, nil)

			if err != nil {
				log.Errorln(err)
				return
			}

			client := &Client{Id: id, hub: hub, conn: conn, send: make(chan []byte, 256)}
			client.hub.register <- client

			go client.writePump()
			go client.readPump()
		default:
			JSONError(rw, errorResp{Message: "Something went wrong..."}, http.StatusInternalServerError)
		}
	}
}
