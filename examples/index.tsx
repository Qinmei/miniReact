import React from "../src";

const updateValue = (e) => console.log(e.target.value);
const clickHandler = (e) => console.log(e);

const Info = (props) => {
  const { value } = props;

  console.log("component render info", value);
  return <h1>{value}</h1>;
};

let count = 10;

const App = () => {
  const [value, setValue] = React.useState(count);
  const [value2, setValue2] = React.useState(count);

  console.log("component render", value, value2);
  return (
    <div name="a" size={Math.random()}>
      {value}
      {Math.random() > 0.5 && <h3>h3</h3>}
      {undefined}
      {null}

      <div>constant{count}</div>
      <h2>{Math.random()}</h2>
      <span aaa={value}>1</span>
      <span>2</span>
      <span>
        123
        <span>223</span>
      </span>
      <Info value={value} />

      <input oninput={updateValue} value={value} />
      <div
        onClick={() => {
          setValue(value + 1);
        }}
      >
        click{value}
      </div>
      <div
        onClick={() => {
          setValue2(value2 + 1);
        }}
      >
        click2{value2}
      </div>
    </div>
  );
};

const container = document.getElementById("root");
React.render(<App />, container);
