import { MouseEvent, useCallback, useEffect, useState } from "react";
import { ApplicationFull } from "../types";
import { deleteApplication, fetchApplication, updateApplication } from "../requests/applications";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs } from "../Crumbs";
import ApplicationForm from "./ApplicationForm";
import { useSnackbar } from "notistack";
import { FormikValues } from "formik";
import { fetchRepos } from "../requests/repos";
import { getErrorMessage } from "../requests/utils";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Icon,
  IconButton,
  Menu,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Actions,
  HorizontalFiller,
  LinkAction,
  LoadingAction,
  WorkspaceNavBar,
} from "../components";
import { MenuItemLink } from "../components/MenuItemLink";

const Application = () => {
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [deleting, setDelelting] = useState<boolean>(false);
  const [formValid, setFormValid] = useState(false);
  const [formDefaults, setFormDefaults] = useState<any>();
  const [repos, setRepos] = useState<any>();
  const [formValues, setFormValues] = useState<Partial<any>>();
  const [open, setOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const smallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleDelete = () => {
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (appId) {
      setOpen(false);
      setDelelting(true);
      deleteApplication(appId)
        .then(() => {
          enqueueSnackbar("Deleted", {
            variant: "success",
          });
          navigate(`/applications`);
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
    if (formValid && appId && formValues) {
      setUpdating(true);
      updateApplication(appId, formValues)
        .then((updateResp: any) => {
          setApplication(updateResp);
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

  useEffect(() => {
    if (appId) {
      fetchApplication(parseInt(appId))
        .then((data) => {
          setApplication(data);
          setFormDefaults({
            name: data.app.name,
            manifest_path: data.app.manifest_path,
            repo_id: data.app.repo_id,
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
  }, [appId]);

  useEffect(() => {
    fetchRepos()
      .then(setRepos)
      .catch((err) => {
        err.json().then((resp: any) => {
          enqueueSnackbar(getErrorMessage(resp), {
            variant: "error",
          });
        });
      });
  }, [enqueueSnackbar]);

  const handleValueUpdate = (values: FormikValues) => {
    setFormValues(values);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (!appId) {
    throw new Error("The specified app identifier is invalid.");
  }

  return (
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

      <WorkspaceNavBar>
        {application && (
          <Crumbs
            crumbs={[
              {
                label: "applications",
                path: "/",
                current: false,
                icon: "apps",
              },
              {
                label: application.app.name,
                path: `/applications/${application.app.id}`,
                current: true,
              },
            ]}
          />
        )}
        {!application && <HorizontalFiller />}
        <Actions>
          {!smallScreen && (
            <>
              <LinkAction to={`/applications/${appId}/secrets`}>Secrets</LinkAction>

              <LinkAction to={`/applications/${appId}/runs`}>Runs</LinkAction>

              <LinkAction to={`/applications/${appId}/run`}>Run</LinkAction>

              <LoadingAction
                disabled={deleting}
                loading={deleting}
                onClick={handleDelete}
                color="error"
                aria-label="delete"
              >
                Delete
              </LoadingAction>

              <LoadingAction
                disabled={!formValid}
                loading={updating}
                onClick={handleUpdate}
                color="primary"
              >
                Update
              </LoadingAction>
            </>
          )}
          {smallScreen && (
            <>
              <IconButton onClick={handleDelete}>
                <Icon fontSize="small">delete</Icon>
              </IconButton>

              <IconButton onClick={handleUpdate}>
                <Icon fontSize="small">edit</Icon>
              </IconButton>

              <IconButton onClick={handleMenuOpen}>
                <Icon fontSize="small">more_vert</Icon>
              </IconButton>

              {openMenu && (
                <Menu anchorEl={anchorEl} open={openMenu} onClose={handleMenuClose}>
                  <MenuItemLink to={`/applications/${appId}/secrets`}>Secrets</MenuItemLink>

                  <MenuItemLink to={`/applications/${appId}/runs`}>Runs</MenuItemLink>

                  <MenuItemLink to={`/applications/${appId}/run`}>Run</MenuItemLink>
                </Menu>
              )}
            </>
          )}
        </Actions>
      </WorkspaceNavBar>

      {repos && formDefaults && (
        <ApplicationForm
          repos={repos}
          initialValues={formDefaults}
          formValid={setFormValid}
          handleValueUpdate={handleValueUpdate}
        />
      )}
    </>
  );
};

export default Application;
