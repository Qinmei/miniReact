import React from "../src";

const updateValue = (e) => console.log(e.target.value);
const clickHandler = (e) => console.log(e);

const Info = (props) => {
  const { value } = props;
  return <h1>{value}</h1>;
};

const App = () => {
  const [value, setValue] = React.useState(10);
  console.log("useState", value, setValue);
  return (
    <div name="a">
      <span aaa={value}>1</span>
      <span>2</span>
      <span>
        123
        <span>223</span>
      </span>
      <input oninput={updateValue} value={value} />
      <div onClick={() => setValue(value + 1)}>click{value}</div>
      <Info value={123} />
    </div>
  );
};

const container = document.getElementById("root");
React.render(<App />, container);
