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
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Hidden,
  Icon,
  IconButton,
  Menu,
  styled,
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

const FormContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  max-width: 800px;
`;

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
  }, [appId, enqueueSnackbar]);

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
                label: "apps",
                path: "/",
                current: false,
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
          <LoadingAction
            disabled={deleting}
            loading={deleting}
            onClick={handleDelete}
            color="error"
            aria-label="delete"
            icon="delete"
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

          <Hidden smDown={true}>
            <LinkAction to={`/applications/${appId}/secrets`}>Secrets</LinkAction>
            <LinkAction to={`/applications/${appId}/runs`}>Runs</LinkAction>
            <LinkAction
              to={`/applications/${appId}/run`}
              icon="play_circle"
              iconColor={theme.palette.success.main}
              iconSize="medium"
            >
              Run
            </LinkAction>
          </Hidden>

          <Hidden smUp={true}>
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
          </Hidden>
        </Actions>
      </WorkspaceNavBar>

      {repos && formDefaults && (
        <FormContainer sx={{ mt: 3 }} maxWidth={false}>
          <ApplicationForm
            repos={repos}
            initialValues={formDefaults}
            formValid={setFormValid}
            handleValueUpdate={handleValueUpdate}
          />
        </FormContainer>
      )}
    </>
  );
};

export default Application;
