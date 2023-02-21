import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Highlight from "react-highlight";
import { fetchLogs } from "../requests/logs";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";

import "highlight.js/styles/a11y-dark.css";
import "./logs.css";
import { Alert, Box } from "@mui/material";

const waitForOpenConnection = (socket: WebSocket) => {
  return new Promise((resolve, reject) => {
    const maxNumberOfAttempts = 10;
    const intervalTime = 200;
    let currentAttempt = 0;
    const interval = setInterval(() => {
      if (currentAttempt > maxNumberOfAttempts - 1) {
        clearInterval(interval);
        reject(new Error("Maximum number of attempts exceeded"));
      } else if (socket.readyState === socket.OPEN) {
        clearInterval(interval);
        resolve("");
      }
      currentAttempt++;
    }, intervalTime);
  });
};

const sendMessage = async (socket: WebSocket, msg: any) => {
  if (socket.readyState !== socket.OPEN) {
    await waitForOpenConnection(socket);
    socket.send(msg);
  } else {
    socket.send(msg);
  }
};

const Logs = ({ job, ws }: { job: any; ws: WebSocket | null }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const logWrapRef = useRef<HTMLDivElement>(null);
  const [clientHeight, setVh] = useState<number>();
  const [clientWidth, setVw] = useState<number>();

  const getVh = useCallback(() => {
    return Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  }, []);
  const getVw = useCallback(() => {
    return Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setVh(getVh());
      setVw(getVw());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [getVh, getVw]);

  useEffect(() => {
    setVh(getVh());
    setVw(getVw());
  }, []);

  const scrollToBottom = () => {
    if (logWrapRef.current) {
      logWrapRef.current.scrollIntoView();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs, clientWidth, clientHeight]);

  useEffect(() => {
    if (job && job.phase === "Running") {
      const apiCall = {
        event: "logs:subscribe",
        data: {
          jobId: job.id,
        },
        resource_namespace: job?.meta?.namespace,
        resource_name: job.name,
      };

      if (ws) {
        try {
          sendMessage(ws, JSON.stringify(apiCall));
        } catch (err) {
          enqueueSnackbar(getErrorMessage(err), {
            variant: "error",
          });
        }
      }
    }
  }, [ws, job]);

  useEffect(() => {
    if (ws && ws.OPEN) {
      ws.onmessage = function (event) {
        const json = JSON.parse(event.data);
        setLiveLogs((prev) => [...prev, ...[json.data]]);
      };
    }
  }, [ws]);

  useEffect(() => {
    fetchLogs(job.id)
      .then((data) => {
        let fetchedLogs: string[] = [];
        data.forEach((obj: any) => {
          fetchedLogs = [...fetchedLogs, ...obj.file_data.logs];
        });
        setLogs(fetchedLogs);
      })
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      });
  }, [job.id]);

  return (
    <>
      {(logs && logs.length) || (liveLogs && liveLogs.length) ? (
        <Box
          sx={{ p: 0, overflowY: "scroll", maxHeight: clientHeight ? clientHeight - 200 : "100%" }}
        >
          <Highlight className="plaintext">
            {logs && logs.length > 0 && logs?.map((log, index) => <div key={index}>{log}</div>)}

            {liveLogs &&
              liveLogs.length > 0 &&
              liveLogs?.map((log, index) => <div key={index}>{log}</div>)}
          </Highlight>
          <div ref={logWrapRef} />
        </Box>
      ) : (
        <Alert variant="outlined" severity="info">
          No logs collected from this run.
        </Alert>
      )}
    </>
  );
};

export default Logs;
