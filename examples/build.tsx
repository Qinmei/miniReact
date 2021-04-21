import React from "../buildReact/index";

function Counter() {
  const [state, setState] = React.useState(1);
  return (
    <div>
      <h1 onClick={() => setState((c) => c + 1)}>Count: {state}</h1>
      <span>1123</span>
    </div>
  );
}
const element = <Counter />;
const container = document.getElementById("root");
React.render(element, container);
