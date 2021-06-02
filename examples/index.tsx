import React from "../src";

const App = () => {
  const [value, setValue] = React.useState(10);
  const [value2, setValue2] = React.useState(10);

  React.useEffect(() => {
    console.log("commitPassive", value);
      setValue2((value) => value + 1);
  }, [value]);

  return (
    <div name="app">
      <One value={value}></One>
      <h1>111</h1>

      <div>App value: {value}</div>
      <div>App value2:{value2}</div>
      <button
        onClick={() => {
          setValue(value + 1);
        }}
      >
        click1
      </button>
      <button
        onClick={() => {
          setValue2(value2 + 1);
        }}
      >
        click2
      </button>
    </div>
  );
};

const One = (props) => {
  const { value } = props;
  const [num, setNum] = React.useState(5);

  return (
    <div name="info">
      <Two value={num}></Two>
      <div>One value: {value}</div>
      <div>One num: {num}</div>
      <button
        onClick={() => {
          setNum(num + 1);
        }}
      >
        {value}-{num}
      </button>
    </div>
  );
};

const Two = (props) => {
  const { value } = props;
  const [num, setNum] = React.useState(5);

  return (
    <div name="info">
      <Three value={num}></Three>

      <div>Two value: {value}</div>
      <div>Two num: {num}</div>

      {value % 2 === 0 ? <h1>{value} </h1> : <h2>{value}</h2>}

      <button
        onClick={() => {
          setNum(num + 1);
        }}
      >
        {value}-{num}
      </button>
    </div>
  );
};

const Three = (props) => {
  const { value } = props;
  const [num, setNum] = React.useState(5);
  const [num2, setNum2] = React.useState(5);

  return (
    <div name="info">
      <div>Three value: {value}</div>
      <div>Three num: {num}</div>

      {value % 2 === 0 ? <h1>{value} </h1> : <h2>{value}</h2>}

      <button
        onClick={() => {
          setNum(num + 1);
        }}
      >
        {value}-{num}
      </button>
    </div>
  );
};

const container = document.getElementById("root");
React.render(<App />, container);
