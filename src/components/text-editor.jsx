import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import {
  ActionCableContext,
  DocumentsChannelSubscriber,
} from "../utils/action-cable";
import { useParams } from "react-router-dom";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  ['blockquote', 'code-block'],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor({ user }) {
  const { id: documentId } = useParams();
  const [quill, setQuill] = useState();
  const { consumer } = useContext(ActionCableContext);
  const wrapperRef = useRef(null);

  const textChangeHandler = useCallback(
    (delta, oldDelta, source) => {
      if (source !== "user") return;
      consumer.send({
        command: "message",
        identifier: consumer.subscriptions.subscriptions[0].identifier,
        data: JSON.stringify({
          action: "test",
          data: JSON.stringify(delta),
          user,
        }),
      });
    },
    [consumer, user]
  );

  const onChanged = useCallback(
    (data, userId) => {
      if (user !== userId) quill.updateContents(data);
    },
    [quill, user]
  );

  const onSubscribed = useCallback(
    (data) => {
      quill.setContents(data);
      quill.enable();
    },
    [quill]
  );

  useLayoutEffect(() => {
    if (!wrapperRef) return;

    wrapperRef.current.innerHTML = "";
    const editor = document.createElement("div");
    wrapperRef.current.append(editor);

    const quill = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    setQuill(quill);
  }, []);

  useEffect(() => {
    if (!quill) return;

    const interval = setInterval(() => {
      const data = quill.getContents();
      fetch(`http://localhost:5000/documents/${documentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: documentId,
          data: JSON.stringify(data),
        }),
      });
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [quill]);

  useEffect(() => {
    if (!quill) return;

    quill.on("text-change", textChangeHandler);

    return () => {
      quill.off("text-change", textChangeHandler);
    };
  }, [quill, textChangeHandler]);

  return (
    <DocumentsChannelSubscriber
      connection={{
        channel: "DocumentsChannel",
        document: documentId,
        user,
      }}
      onChanged={onChanged}
      onSubscribed={onSubscribed}
    >
      <div id="container" className="container" ref={wrapperRef}></div>
    </DocumentsChannelSubscriber>
  );
}
