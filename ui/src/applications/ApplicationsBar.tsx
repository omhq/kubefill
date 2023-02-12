import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";

function ApplicationsBar() {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            p: 1,
            m: 1,
            borderRadius: 1,
            alignItems: "center",
          }}
        >
          <Box>
            <Link sx={{ ml: 1, mr: 1 }} underline="none" color="inherit" href={`/applications/new`}>
              New
            </Link>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default ApplicationsBar;
