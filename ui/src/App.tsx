import { Routes, Route } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import Application from "./applications/Application";
import Applications from "./applications/Applications";
import Jobs from "./jobs/Jobs";
import Job from "./jobs/Job";
import Run from "./run";
import "./App.css";
import ApplicationCreate from "./applications/ApplicationCreate";
import Repos from "./repos/Repos";
import Repo from "./repos/Repo";
import Settings from "./settings/Settings";
import RepoCreate from "./repos/RepoCreate";
import Secrets from "./secrets/Secrets";
import Secret from "./secrets/Secret";
import SecretCreate from "./secrets/SecretCreate";

const App = () => {
  return (
    <>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Routes>
          <Route path="/" element={<Applications />} />
          <Route path="/repos/" element={<Repos />} />
          <Route path="/repos/new" element={<RepoCreate />} />
          <Route path="/repos/:repoId" element={<Repo />} />
          <Route path="/applications/" element={<Applications />} />
          <Route path="/applications/new" element={<ApplicationCreate />} />
          <Route path="/applications/:appId" element={<Application />} />
          <Route path="/applications/:appId/secrets" element={<Secrets />} />
          <Route path="/applications/:appId/secrets/new" element={<SecretCreate />} />
          <Route path="/applications/:appId/secrets/:secretId" element={<Secret />} />
          <Route path="/applications/:appId/run" element={<Run />} />
          <Route path="/applications/:appId/runs" element={<Jobs />} />
          <Route path="/applications/:appId/runs/:jobId" element={<Job />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </SnackbarProvider>
    </>
  );
};

export default App;
