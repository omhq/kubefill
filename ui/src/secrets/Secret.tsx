import { useEffect, useState } from "react";
import { ApplicationFull, Secret as SecretType } from "../types";
import {
  fetchApplicationSecret,
  updateApplicationSecret,
  deleteApplicationSecret,
  fetchApplication,
} from "../requests/applications";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs, Crumb } from "../Crumbs";
import SecretBar from "./SecretBar";
import Drawer from "../globals/Drawer";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { truncate } from "lodash";
import SecretForm from "./SecretForm";
import { FormikValues } from "formik";

const Repo = () => {
  const { appId, secretId } = useParams<{ appId: string; secretId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDelelting] = useState<boolean>(false);
  const [secret, setSecret] = useState<SecretType>();
  const [formValues, setFormValues] = useState<Partial<any>>();
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [formValid, setFormValid] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const handleDelete = () => {
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (appId && secretId) {
      setOpen(false);
      setDelelting(true);
      deleteApplicationSecret(appId, secretId)
        .then(() => {
          enqueueSnackbar("Deleted", {
            variant: "success",
          });
          navigate(`/applications/${appId}/secrets`);
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        })
        .finally(() => {
          setDelelting(false);
        });
    }
  };

  const handleUpdate = () => {
    if (formValid && appId && secretId && formValues) {
      setUpdating(true);
      updateApplicationSecret(appId, secretId, formValues)
        .then((updateResp: any) => {
          setSecret(updateResp);
          enqueueSnackbar("Updated", {
            variant: "success",
          });
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        })
        .finally(() => {
          setUpdating(false);
        });
    }
  };

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values);
  };

  useEffect(() => {
    if (application?.app && secret) {
      setCrumbs([
        {
          label: "applications",
          path: "/applications",
          current: false,
        },
        {
          label: application.app.name,
          path: `/applications/${application.app.id}`,
          current: false,
        },
        {
          label: "secrets",
          path: `/applications/${application.app.id}/secrets`,
          current: false,
        },
        {
          label: truncate(secret.name),
          path: `/applications/${application.app.id}/secrets/${secret.id}`,
          current: true,
        },
      ]);
    }
  }, [application, secret]);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (appId && secretId) {
      fetchApplicationSecret(appId, secretId).then((data) => {
        setSecret(data);
        setFormDefaults({
          name: data.name,
        });
      });
    }
  }, [secretId]);

  useEffect(() => {
    let unsubscribed = false;

    if (appId) {
      fetchApplication(parseInt(appId)).then((data) => {
        setApplication(data);
      });
    }

    return () => {
      unsubscribed = true;
    };
  }, [appId]);

  return (
    <>
      {secretId && (
        <>
          <Dialog
            fullScreen={fullScreen}
            open={open}
            onClose={handleClose}
            aria-labelledby="responsive-dialog-title"
          >
            <DialogTitle id="responsive-dialog-title">{"Confirm delete?"}</DialogTitle>
            <DialogContent>
              <DialogContentText>This action can't be undone.</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          <Drawer
            child={
              <SecretBar
                updating={updating}
                deleting={deleting}
                formValid={formValid}
                del={handleDelete}
                update={handleUpdate}
              />
            }
            body={
              <>
                <Crumbs crumbs={crumbs} />

                {secret && formDefaults && (
                  <SecretForm
                    secretId={secret.id}
                    initialValues={formDefaults}
                    formValid={setFormValid}
                    handleValueUpdate={handleValueUpdate}
                  />
                )}
              </>
            }
          />
        </>
      )}
    </>
  );
};

export default Repo;
