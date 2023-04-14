export const isManifests = (manifests: any): boolean => {
  const required = ["data", "schema", "ui_schema"];

  if (manifests) {
    let checkAll = required.every((i) => manifests.hasOwnProperty(i));
    if (checkAll) {
      return true;
    }
  }

  return false;
};
