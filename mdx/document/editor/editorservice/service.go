package editorservice

import (
	"context"

	"github.com/kubefill/kubefill/mdx/document/editor"
	parserv1 "github.com/kubefill/kubefill/mdx/gen/proto/go/runme/parser/v1"
	"go.uber.org/zap"
	"golang.org/x/exp/constraints"
)

type parserServiceServer struct {
	parserv1.UnimplementedParserServiceServer

	logger *zap.Logger
}

func NewParserServiceServer(logger *zap.Logger) parserv1.ParserServiceServer {
	return &parserServiceServer{logger: logger}
}

func (s *parserServiceServer) Deserialize(_ context.Context, req *parserv1.DeserializeRequest) (*parserv1.DeserializeResponse, error) {
	s.logger.Info("Deserialize", zap.ByteString("source", req.Source[:min(len(req.Source), 64)]))

	notebook, err := editor.Deserialize(req.Source)
	if err != nil {
		s.logger.Info("failed to call Deserialize", zap.Error(err))
		return nil, err
	}

	cells := make([]*parserv1.Cell, 0, len(notebook.Cells))
	for _, cell := range notebook.Cells {
		cells = append(cells, &parserv1.Cell{
			Kind:       parserv1.CellKind(cell.Kind),
			Value:      cell.Value,
			LanguageId: cell.LanguageID,
			Metadata:   cell.Metadata,
		})
	}

	return &parserv1.DeserializeResponse{
		Notebook: &parserv1.Notebook{
			Cells:    cells,
			Metadata: notebook.Metadata,
		},
	}, nil
}

func (s *parserServiceServer) Serialize(_ context.Context, req *parserv1.SerializeRequest) (*parserv1.SerializeResponse, error) {
	s.logger.Info("Serialize")

	cells := make([]*editor.Cell, 0, len(req.Notebook.Cells))
	for _, cell := range req.Notebook.Cells {
		cells = append(cells, &editor.Cell{
			Kind:       editor.CellKind(cell.Kind),
			Value:      cell.Value,
			LanguageID: cell.LanguageId,
			Metadata:   cell.Metadata,
		})
	}
	data, err := editor.Serialize(&editor.Notebook{
		Cells:    cells,
		Metadata: req.Notebook.Metadata,
	})
	if err != nil {
		s.logger.Info("failed to call Serialize", zap.Error(err))
		return nil, err
	}
	return &parserv1.SerializeResponse{Result: data}, nil
}

func min[T constraints.Ordered](a, b T) T {
	if a < b {
		return a
	}
	return b
}
