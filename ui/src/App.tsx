import { Routes, Route, useNavigate } from "react-router-dom";
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
import ProtectedRoute, { ProtectedRouteProps } from "./partials/ProtectedRoute";
import { useLocalStorageAuth } from "./hooks/auth";
import { useEffect, useReducer } from "react";
import { getSelf } from "./requests/auth";
import { authSelf, initialState, reducer } from "./reducers";
import { LOCAL_STORAGE } from "./constants";
import Login from "./login";
import { PrimaryLayout } from "./layouts";
import { ThemeProvider } from "@mui/material";
import { theme } from "./theme";

const App = () => {
  const [_, dispatch] = useReducer(reducer, initialState);
  const auth = useLocalStorageAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!(auth && Object.keys(auth).length);

  const defaultProtectedRouteProps: Omit<ProtectedRouteProps, "outlet"> = {
    isAuthenticated: isAuthenticated,
    authenticationPath: "/login",
  };

  useEffect(() => {
    if (isAuthenticated) {
      getSelf()
        .then((data) => {
          dispatch(authSelf(data));
        })
        .catch((err) => {
          localStorage.removeItem(LOCAL_STORAGE);
          navigate("/login");
        });
    }
  }, [dispatch, isAuthenticated]);

  return (
    <>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <Routes>
            <Route element={<PrimaryLayout />}>
              <Route
                path="/"
                element={
                  <ProtectedRoute {...defaultProtectedRouteProps} outlet={<Applications />} />
                }
              />

              <Route
                path="/applications"
                element={
                  <ProtectedRoute {...defaultProtectedRouteProps} outlet={<Applications />} />
                }
              />

              <Route
                path="/applications/:appId"
                element={
                  <ProtectedRoute {...defaultProtectedRouteProps} outlet={<Application />} />
                }
              />

              <Route
                path="/applications/:appId/runs"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Jobs />} />}
              />

              <Route
                path="/applications/:appId/runs/:jobId"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Job />} />}
              />

              <Route
                path="/repos"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Repos />} />}
              />

              <Route
                path="/repos/new"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<RepoCreate />} />}
              />

              <Route
                path="/repos/:repoId"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Repo />} />}
              />

              <Route
                path="/applications/new"
                element={
                  <ProtectedRoute {...defaultProtectedRouteProps} outlet={<ApplicationCreate />} />
                }
              />

              <Route
                path="/applications/:appId/secrets"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Secrets />} />}
              />

              <Route
                path="/applications/:appId/secrets/new"
                element={
                  <ProtectedRoute {...defaultProtectedRouteProps} outlet={<SecretCreate />} />
                }
              />

              <Route
                path="/applications/:appId/secrets/:secretId"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Secret />} />}
              />

              <Route
                path="/applications/:appId/run"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Run />} />}
              />

              <Route
                path="/settings"
                element={<ProtectedRoute {...defaultProtectedRouteProps} outlet={<Settings />} />}
              />
            </Route>

            <Route path="/login" element={<Login dispatch={dispatch} />} />
          </Routes>
        </SnackbarProvider>
      </ThemeProvider>
    </>
  );
};

export default App;
