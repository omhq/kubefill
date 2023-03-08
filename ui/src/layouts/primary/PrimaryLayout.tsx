import { styled } from "@mui/material";
import { FunctionComponent, ReactElement } from "react";
import { Outlet } from "react-router-dom";
import { PrimaryNavBar } from "./PrimaryNavBar";

const Root = styled("div")``;

const Main = styled("main")``;

export const PrimaryLayout: FunctionComponent = (): ReactElement => {
  return (
    <Root>
      <PrimaryNavBar />
      <Main>
        <Outlet />
      </Main>
    </Root>
  );
};
