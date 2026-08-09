// Prism core + the languages the Docker & DevOps lessons use. `docker` (aliased
// `dockerfile`) highlights Dockerfiles; `yaml` covers Compose files and GitHub
// Actions workflows; `bash` covers shell/CLI commands (docker, kubectl, git);
// `json` covers config and API payloads. Plain terminal output, tables, and
// diagrams use the `text` fence, which Prism leaves unhighlighted.
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

export default Prism;
