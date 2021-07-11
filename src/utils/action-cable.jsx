import { Component, createContext, useEffect, useState } from "react";
import actionCable from "actioncable";

export const ActionCableContext = createContext();

export class DocumentsChannelSubscriber extends Component {
  componentDidMount() {
    this.subscription = this.context.consumer.subscriptions.create(
      this.props.connection,
      {
        received: (data) => {
          console.log(data);
          const parsedData = JSON.parse(data.data);
          console.log(parsedData);
          if (data.action === "change")
            this.props.onChanged(parsedData, data.user);
          if (data.action === "set") this.props.onSubscribed(parsedData);
        },
      }
    );
  }
  render() {
    return this.props.children;
  }
}

DocumentsChannelSubscriber.contextType = ActionCableContext;

export default function ActionCableProvider({ children }) {
  const [consumer, setConsumer] = useState();

  useEffect(() => {
    setConsumer(actionCable.createConsumer(`${process.env.REACT_APP_API_WS_HOST}`));
    return () => {
      if (consumer) consumer.disconnect();
    };
  }, []);

  if (!consumer) {
    return null;
  }

  return (
    <ActionCableContext.Provider value={{ consumer }}>
      {children}
    </ActionCableContext.Provider>
  );
}
