import { FunctionComponent, ReactElement, useEffect, useState } from "react";
import { Repo as RepoType } from "../types";
import { fetchRepo, syncRepo, updateRepo } from "../requests/repos";
import { deleteRepo } from "../requests/repos";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs, ICrumb } from "../Crumbs";
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { getErrorMessage } from "../requests/utils";
import { truncate } from "lodash";
import RepoForm from "./RepoForm";
import { FormikValues } from "formik";
import { Actions, LoadingAction, WorkspaceNavBar } from "../components";
import { Box } from "@mui/system";

const Repo: FunctionComponent = (): ReactElement => {
  const { repoId } = useParams<{ repoId: string }>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDelelting] = useState<boolean>(false);
  const [repo, setRepo] = useState<RepoType>();
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
    if (repoId) {
      setOpen(false);
      setDelelting(true);
      deleteRepo(repoId)
        .then(() => {
          enqueueSnackbar("Deleted", {
            variant: "success",
          });
          navigate(`/repos`);
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

  const handleSync = () => {
    if (repoId) {
      setLoading(true);
      syncRepo(repoId)
        .then((updateResp: any) => {
          setRepo(updateResp);
          enqueueSnackbar("Synced", {
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
          setLoading(false);
        });
    }
  };

  const handleUpdate = () => {
    if (formValid && repoId && formValues) {
      setUpdating(true);
      updateRepo(repoId, formValues)
        .then((updateResp: any) => {
          setRepo(updateResp);
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
    if (repoId) {
      fetchRepo(repoId)
        .then((data) => {
          setRepo(data);
          setFormDefaults({
            url: data.url,
            branch: data.branch,
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
  }, [repoId]);

  if (!repoId) {
    return <></>;
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
          <Button autoFocus={true} onClick={handleClose}>
            Cancel
          </Button>
          <Button autoFocus={true} onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <WorkspaceNavBar>
        <Crumbs
          crumbs={
            repo
              ? [
                  {
                    label: "repos",
                    path: "/repos",
                    current: false,
                    icon: "code",
                  },
                  {
                    label: truncate(repo.url, {
                      length: 100,
                    }),
                    path: `/repos/${repo.id}`,
                    current: true,
                  },
                ]
              : []
          }
        />
        <Actions>
          <LoadingAction
            aria-label="delete"
            onClick={handleDelete}
            loading={deleting}
            icon="delete"
          >
            Delete
          </LoadingAction>

          <LoadingAction loading={loading} onClick={handleSync} icon="sync">
            Sync
          </LoadingAction>

          <LoadingAction
            disabled={!formValid || updating}
            loading={updating}
            onClick={handleUpdate}
            icon="save"
          >
            Update
          </LoadingAction>
        </Actions>
      </WorkspaceNavBar>

      <Container sx={{ mt: 2 }}>
        <Typography variant="body1" fontWeight={600} gutterBottom={true}>
          Branch
        </Typography>

        <Typography variant="body1" gutterBottom={true}>
          {repo?.branch}
        </Typography>

        {repo?.commit && (
          <>
            <Typography variant="body1" fontWeight={600} gutterBottom={true}>
              Latest commit
            </Typography>

            <Typography variant="body1" gutterBottom={true}>
              {truncate(repo?.hash, {
                length: 32,
                omission: "...",
              })}
            </Typography>

            <Typography variant="body1" gutterBottom={true}>
              {repo?.commit}
            </Typography>
          </>
        )}

        {repo && formDefaults && (
          <Box sx={{ mt: 3 }}>
            <RepoForm
              repoId={repo.id}
              initialValues={formDefaults}
              formValid={setFormValid}
              handleValueUpdate={handleValueUpdate}
            />
          </Box>
        )}
      </Container>
    </>
  );
};

export default Repo;
