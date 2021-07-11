import { useState } from "react";
import { v4 } from "uuid";
import TextEditor from "./components/text-editor";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

function App() {
  const [user, _] = useState(v4());
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Redirect to={`/documents/${v4()}`} />
        </Route>
        <Route path="/documents/:slug">
          <TextEditor user={user} />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
