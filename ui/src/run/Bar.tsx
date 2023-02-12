import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Box } from "@mui/material";
import { LoadingButton } from "@mui/lab";

function Bar({
  appId,
  loading,
  jobId,
  run,
}: {
  appId: string;
  loading: boolean;
  jobId: number | null;
  run: () => void;
}) {
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
          {jobId && (
            <Link
              sx={{ ml: 1, mr: 1 }}
              underline="none"
              color="inherit"
              href={`/applications/${appId}/runs/${jobId}`}
            >
              Logs
            </Link>
          )}
          <Box>
            <LoadingButton
              loading={loading}
              onClick={run}
              variant="outlined"
              color="inherit"
              sx={{ ml: 1, mr: 1 }}
            >
              Run
            </LoadingButton>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
export default Bar;
