import { Crumbs } from "../Crumbs";
import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { fetchSettings } from "../requests/settings";
import { Typography } from "@mui/material";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";
import { WorkspaceNavBar } from "../components";

const Settings: FunctionComponent = (): ReactElement => {
  const [settings, setSettings] = useState<Record<string, string>>();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      });
  }, []);

  return (
    <>
      <WorkspaceNavBar>
        <Crumbs
          crumbs={[
            {
              label: "settings",
              path: "/settings",
              current: true,
            },
          ]}
        />
      </WorkspaceNavBar>

      {settings && (
        <>
          <Typography variant="body1" gutterBottom={true}>
            REPO_ROOT: {settings.repo_root}
          </Typography>

          <Typography variant="body1" gutterBottom={true}>
            SSH_ROOT: {settings.ssh_root}
          </Typography>

          <Typography variant="body1" gutterBottom={true}>
            PRIVATE_KEY: {settings.private_key}
          </Typography>
        </>
      )}
    </>
  );
};

export default Settings;
