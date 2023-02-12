package reposerver

type ManifestResponses struct {
	Data      map[string]interface{} `json:"data"`
	UI_Schema map[string]interface{} `json:"ui_schema"`
	Schema    map[string]interface{} `json:"schema"`
}

type ServerConfig struct {
	RootDir string
}

type Server struct {
	ServerConfig
}
