import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { ApplicationFull, Secret as SecretType } from "../types";
import {
  fetchApplicationSecret,
  updateApplicationSecret,
  deleteApplicationSecret,
  fetchApplication,
} from "../requests/applications";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs } from "../Crumbs";
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
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";

const EditSecret: FunctionComponent = (): ReactElement => {
  const { appId, secretId } = useParams<{ appId: string; secretId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDelelting] = useState<boolean>(false);
  const [secret, setSecret] = useState<SecretType>();
  const [formValues, setFormValues] = useState<Partial<any>>();
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

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (appId && secretId) {
      fetchApplicationSecret(appId, secretId)
        .then((data) => {
          setSecret(data);
          setFormDefaults({
            name: data.name,
          });
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        });
    }
  }, [secretId]);

  useEffect(() => {
    let unsubscribed = false;

    if (appId) {
      fetchApplication(parseInt(appId))
        .then((data) => {
          setApplication(data);
        })
        .catch((err) => {
          err.json().then((resp: any) => {
            enqueueSnackbar(getErrorMessage(resp), {
              variant: "error",
            });
          });
        });
    }

    return () => {
      unsubscribed = true;
    };
  }, [appId]);

  if (!secretId) {
    throw new Error("The specified secret identifier is invalid.");
  }

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">Confirm delete?</DialogTitle>
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

      <WorkspaceNavBar>
        <Crumbs
          crumbs={
            application && secret
              ? [
                  {
                    label: "applications",
                    path: "/applications",
                    current: false,
                    icon: "apps",
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
                    icon: "lock",
                  },
                  {
                    label: truncate(secret.name),
                    path: `/applications/${application.app.id}/secrets/${secret.id}`,
                    current: true,
                  },
                ]
              : []
          }
        />

        <Actions>
          <LoadingAction
            disabled={deleting}
            loading={deleting}
            onClick={handleDelete}
            aria-label="Delete"
            icon="delete"
          >
            Delete
          </LoadingAction>

          <LoadingAction
            disabled={!formValid || updating}
            loading={updating}
            onClick={handleUpdate}
            aria-label="Update"
            icon="save"
          >
            Update
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      {secret && formDefaults && (
        <SecretForm
          secretId={secret.id}
          initialValues={formDefaults}
          formValid={setFormValid}
          handleValueUpdate={handleValueUpdate}
        />
      )}
    </>
  );
};

export default EditSecret;
