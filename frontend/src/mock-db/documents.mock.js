export const initialDocuments = [
    {
        "id": "2",
        "content": "# Introdução\n\nBem-vindo à documentação.\n\n#financeiro\n#teste",
        "version": 1,
        "updated_at": "2026-01-01T00:00:01.000Z",
        "description": "Introdução geral ao sistema Stone.",
        "observations": "Documento inicial gerado automaticamente.",
        "permissions": [
            { "profileId": "admin", "view": true, "edit": true, "delete": true },
            { "profileId": "editor", "view": true, "edit": true, "delete": false },
            { "profileId": "guest", "view": true, "edit": false, "delete": false }
        ]
    },
    {
        "id": "3",
        "content": "# Introdução\n\nBem-vindo à documentação.\n\n[[2]]\n\nDocumento a parte para teste do filtro do search\n\n#financeiro\n#dialog",
        "version": 1,
        "updated_at": "2026-01-01T00:00:01.000Z",
        "description": "Documento de teste para funcionalidades de busca.",
        "observations": "Utilizado para validar filtros de busca.",
        "permissions": [
            { "profileId": "admin", "view": true, "edit": true, "delete": true },
            { "profileId": "editor", "view": true, "edit": true, "delete": false },
            { "profileId": "guest", "view": true, "edit": false, "delete": false }
        ]
    },
    {
        "id": "4",
        "content": "# Introdução\n\n```mermaid\ngraph TD;\n    A-->B;\n    A-->C;\n    B-->D;\n    C-->D;\n```\n",
        "version": 1,
        "updated_at": "2026-01-01T00:00:01.000Z",
        "description": "Exemplo de diagrama Mermaid.",
        "observations": "Teste de visualização de diagramas.",
        "permissions": [
            { "profileId": "admin", "view": true, "edit": true, "delete": true },
            { "profileId": "editor", "view": true, "edit": true, "delete": false },
            { "profileId": "guest", "view": true, "edit": false, "delete": false }
        ]
    }
];
