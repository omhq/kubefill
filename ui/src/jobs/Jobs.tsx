import { useEffect, useState } from "react";
import { fetchApplication, fetchApplicationJobs } from "../requests/applications";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Chip, IconButton, Alert } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Crumb, Crumbs } from "../Crumbs";
import { Visibility } from "@mui/icons-material";
import { ApplicationFull } from "../types";
import Drawer from "../globals/Drawer";

const Jobs = () => {
  const navigate = useNavigate();
  const { appId } = useParams<{ appId: string }>();
  const [application, setApplication] = useState<ApplicationFull>();
  const [jobs, setJobs] = useState<any[]>();
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 50 },
    { field: "name", headerName: "NAME", flex: 0.2, width: 100 },
    {
      field: "namespace",
      headerName: "NAMESPACE",
      flex: 0.2,
      width: 150,
      valueGetter: (params) => {
        let result = [];
        if (params.row?.meta?.namespace) {
          result.push(params.row.meta.namespace);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "created",
      headerName: "CREATED ON",
      flex: 0.6,
      width: 200,
      valueGetter: (params) => {
        let result = [];
        if (params.row?.model?.CreatedAt) {
          const date = new Date(params.row.model.CreatedAt);
          result.push(date);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "phase",
      headerName: "PHASE",
      flex: 0.2,
      minWidth: 200,
      renderCell: (params) => {
        return (
          <>
            {params.row.phase === "Running" && (
              <>
                <Chip label={params.row.phase} color="warning" variant="outlined" />
              </>
            )}

            {params.row.phase === "Succeeded" && (
              <>
                <Chip label={params.row.phase} color="success" variant="outlined" />
              </>
            )}

            {params.row.phase === "Failed" && (
              <>
                <Chip label={params.row.phase} color="error" variant="outlined" />
              </>
            )}
          </>
        );
      },
    },
    {
      field: "action",
      headerName: "",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const onClick = (e: any) => {
          navigate(`/applications/${params.row.application_id}/runs/${params.row.id}`);
        };

        return (
          <Box>
            <IconButton
              onClick={onClick}
              size="small"
              color="default"
              aria-label="view"
              component="label"
            >
              <Visibility />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  useEffect(() => {
    if (application?.app) {
      setCrumbs([
        {
          label: "applications",
          path: "/",
          current: false,
        },
        {
          label: application.app.name,
          path: `/applications/${application.app.id}`,
          current: false,
        },
        {
          label: "runs",
          path: `/applications/${application.app.id}/runs`,
          current: true,
        },
      ]);
    }
  }, [application]);

  useEffect(() => {
    let unsubscribed = false;

    if (appId) {
      fetchApplicationJobs(parseInt(appId)).then((data) => {
        if (!unsubscribed) {
          const sortedData = data.sort((a, b) => b.id - a.id);
          setJobs(sortedData);
        }
      });

      fetchApplication(parseInt(appId)).then((data) => {
        setApplication(data);
      });
    }

    return () => {
      unsubscribed = true;
    };
  }, [appId]);

  return (
    <div>
      <Drawer
        child={<></>}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {jobs && jobs.length && appId ? (
              <>
                <div style={{ flexGrow: 1 }}>
                  <DataGrid
                    autoHeight
                    rows={jobs}
                    columns={columns}
                    pageSize={100}
                    rowsPerPageOptions={[100]}
                  />
                </div>

                {!jobs.length && <>no jobs</>}
              </>
            ) : (
              <Alert variant="outlined" severity="info">
                This job has never been run.
              </Alert>
            )}
          </>
        }
      />
    </div>
  );
};

export default Jobs;
