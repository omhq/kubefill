import { useEffect, useState } from "react";
import { Repo as RepoType } from "../types";
import { fetchRepo, syncRepo, updateRepo } from "../requests/repos";
import { deleteRepo } from "../requests/repos";
import { useNavigate, useParams } from "react-router-dom";
import { Crumbs, Crumb } from "../Crumbs";
import RepoBar from "./RepoBar";
import Drawer from "../globals/Drawer";
import {
  Button,
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

const Repo = () => {
  const { repoId } = useParams<{ repoId: string }>();
  const [updating, setUpdating] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [deleting, setDelelting] = useState<boolean>(false);
  const [repo, setRepo] = useState<RepoType>();
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

  useEffect(() => {
    if (repo) {
      setCrumbs([
        {
          label: "repos",
          path: "/repos",
          current: false,
        },
        {
          label: truncate(repo.url),
          path: `/repos/${repo.id}`,
          current: true,
        },
      ]);
    }
  }, [repo]);

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

  return (
    <>
      {repoId && (
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
              <RepoBar
                loading={loading}
                updating={updating}
                deleting={deleting}
                formValid={formValid}
                sync={handleSync}
                del={handleDelete}
                update={handleUpdate}
              />
            }
            body={
              <>
                <Crumbs crumbs={crumbs} />

                <Typography variant="body1" fontWeight={600} gutterBottom>
                  Branch
                </Typography>

                <Typography variant="body1" gutterBottom>
                  {repo?.branch}
                </Typography>

                {repo?.commit && (
                  <>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      Latest commit
                    </Typography>

                    <Typography variant="body1" gutterBottom>
                      {truncate(repo?.hash, {
                        length: 32,
                        omission: "...",
                      })}
                    </Typography>

                    <Typography variant="body1" gutterBottom>
                      {repo?.commit}
                    </Typography>
                  </>
                )}

                {repo && formDefaults && (
                  <RepoForm
                    repoId={repo.id}
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
