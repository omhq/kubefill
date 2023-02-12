import { useEffect, useState } from "react";
import { fetchApplications } from "../requests/applications";
import { Application as ApplicationType } from "../types";
import { Box, IconButton, Alert } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Crumb, Crumbs } from "../Crumbs";
import ApplicationsBar from "./ApplicationsBar";
import { useNavigate } from "react-router-dom";
import { Visibility } from "@mui/icons-material";
import Drawer from "../globals/Drawer";

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationType[]>();
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", minWidth: 50 },
    { field: "name", headerName: "NAME", flex: 0.2, width: 100 },
    { field: "repo_id", headerName: "REPO", flex: 0.2, width: 100 },
    { field: "manifest_path", headerName: "MANIFEST PATH", flex: 0.2, width: 100 },
    {
      field: "created",
      headerName: "CREATED ON",
      flex: 0.6,
      width: 200,
      valueGetter: (params) => {
        let result = [];
        if (params.row.created_at) {
          const date = new Date(params.row.created_at);
          result.push(date);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "updated",
      headerName: "UPDATED ON",
      flex: 0.6,
      width: 200,
      valueGetter: (params) => {
        let result = [];
        if (params.row.updated_at) {
          const date = new Date(params.row.updated_at);
          result.push(date);
        } else {
          result = ["Unknown"];
        }
        return result.join(", ");
      },
    },
    {
      field: "action",
      headerName: "",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => {
        const onClick = (e: any) => {
          navigate(`/applications/${params.row.id}`);
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
    let unsubscribed = false;

    setCrumbs([
      {
        label: "applications",
        path: "/",
        current: true,
      },
    ]);

    fetchApplications().then((data) => {
      if (!unsubscribed) {
        const sortedData = data.sort((a, b) => b.id - a.id);
        setApplications(sortedData);
      }
    });

    return () => {
      unsubscribed = true;
    };
  }, []);
  return (
    <>
      <Drawer
        child={<ApplicationsBar />}
        body={
          <>
            <Crumbs crumbs={crumbs} />

            {applications && applications.length ? (
              <>
                <div style={{ flexGrow: 1 }}>
                  <DataGrid
                    autoHeight
                    rows={applications}
                    columns={columns}
                    pageSize={100}
                    rowsPerPageOptions={[100]}
                  />
                </div>

                {!applications.length && <>no apps</>}
              </>
            ) : (
              <Alert variant="outlined" severity="info">
                No applications yet.
              </Alert>
            )}
          </>
        }
      />
    </>
  );
};

export default Applications;
