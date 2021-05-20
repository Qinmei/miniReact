import React from "../src";

const updateValue = (e) => console.log(e.target.value);
const clickHandler = (e) => console.log(e);

const Info = (props) => {
  const { value } = props;
  const [num, setNum] = React.useState(5);

  console.log("component render info", value, num);
  return (
    <div name="a" size={Math.random()}>
      {value}
      {undefined}
      {null}

      <ul>
        {colorArray
          .filter((item) => Math.random() > 0.5)
          .map((item) => (
            <li key={item}>{item}</li>
          ))}
      </ul>

      <div>constant{count}</div>
      <h2>{Math.random()}</h2>
      <span aaa={value}>1</span>
      <span>2</span>
      <span>
        123
        <span>223</span>
      </span>

      <input oninput={updateValue} value={value} />
    </div>
  );
};

let count = 10;

let colorArray = ["red", "green", "orange", "blue", "black", "white"];

const App = () => {
  const [value, setValue] = React.useState(count);
  const [value2, setValue2] = React.useState(count);

  console.log("component render", value, value2);
  return (
    <div name="a" size={Math.random()}>
      {value}
      {undefined}
      {null}

      <ul>
        {colorArray
          .filter((item) => Math.random() > 0.5)
          .map((item) => (
            <li key={item}>{item}</li>
          ))}
      </ul>

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
