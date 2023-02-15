import Drawer from "../globals/Drawer";
import SettingsBar from "./SettingsBar";
import { Crumb, Crumbs } from "../Crumbs";
import { useEffect, useState } from "react";
import { fetchSettings } from "../requests/settings";
import { Typography } from "@mui/material";
import { getErrorMessage } from "../requests/utils";
import { useSnackbar } from "notistack";

const Settings = () => {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    setCrumbs([
      {
        label: "settings",
        path: "/settings",
        current: true,
      },
    ]);
  }, []);

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
      <Drawer
        child={<SettingsBar />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {settings && (
              <>
                <Typography variant="body1" gutterBottom>
                  REPO_ROOT: {settings?.repo_root}
                </Typography>

                <Typography variant="body1" gutterBottom>
                  SSH_ROOT: {settings?.ssh_root}
                </Typography>

                <Typography variant="body1" gutterBottom>
                  PRIVATE_KEY: {settings?.private_key}
                </Typography>
              </>
            )}
          </>
        }
      />
    </>
  );
};

export default Settings;
