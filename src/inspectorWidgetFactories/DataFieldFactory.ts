import DataFieldOptionsInterface from "../inspectorInterfaces/DataFieldOptionsInterface";

export default function DataFieldFactory(id: string, data: string, label: string, fieldOptions: DataFieldOptionsInterface, change: (fieldName: string, value: string) => void, disabled: boolean = false): HTMLDivElement {
  let div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = 'row';
  div.style.alignItems = 'stretch';
  div.style.flexWrap = 'nowrap'
  div.style.width = '100%';
  div.style.marginTop = '2px';

  let labelElem = document.createElement('label');
  labelElem.style.paddingLeft = '4px';
  labelElem.style.flexGrow = '0'
  labelElem.style.flexShrink = '0';
  labelElem.style.flexBasis = '110px';
  labelElem.innerText = label;
  div.append(labelElem);

  let input = document.createElement('input');
  input.type = fieldOptions?.type === 'number' ? 'text' :
    fieldOptions?.type === 'numberMultiIncrement' ? 'text' :
    (fieldOptions?.type || 'text');
  input.min = fieldOptions?.rangeOptions?.min;
  input.max = fieldOptions?.rangeOptions?.max;
  input.step = fieldOptions?.rangeOptions?.step;
  input.id = `inspector__${id}`;
  input.value = `${data}`;
  if (fieldOptions?.type === "checkbox") input.checked = parseInt(data) !== 0;
  input.style.flexGrow = '1';
  input.style.flexShrink = '1';
  input.style.flexBasis = 'content';
  input.style.height = '14px';
  input.style.marginLeft = '14px';
  input.style.marginRight = '14px';
  input.style.fontSize = '8';
  input.style.borderColor = "#222";
  input.style.minWidth = "20px";
  input.disabled = disabled;
  input.style.color = disabled ? "#888": "#ddd";
  input.style.background = disabled ? "#222": "#444";

  if (fieldOptions?.type === 'number') {
    let increment = -parseFloat(fieldOptions?.rangeOptions?.step) || -1;
    let precision = fieldOptions?.rangeOptions?.step?.split('.').length > 1 && fieldOptions?.rangeOptions?.step?.split('.')[1].length || 0;
    let button = createIncrementButton(id, increment, input, change, fieldOptions);
    div.append(button);
  } else if (fieldOptions?.type === 'numberMultiIncrement') {
    let button10 = createIncrementButton(id, -10, input, change, fieldOptions, 1);
    div.append(button10);
    let button1 = createIncrementButton(id, -1, input, change, fieldOptions, 1);
    div.append(button1);
    let button01 = createIncrementButton(id, -0.1, input, change, fieldOptions, 1);
    div.append(button01);
  }

  if (fieldOptions?.type === "range") {
    let value = document.createElement('div');
    value.style.marginLeft = '14px';
    value.innerText = input.value;
    input.addEventListener('input', function() {
      value.innerText = this.value;
    });
    div.append(value);
  }

  div.append(input);

  if (fieldOptions?.type === 'number') {
    let increment = parseFloat(fieldOptions?.rangeOptions?.step) || 1;
    let precision = fieldOptions?.rangeOptions?.step?.split('.').length > 1 && fieldOptions?.rangeOptions?.step?.split('.')[1].length || 0;
    let button = createIncrementButton(id, increment, input, change, fieldOptions);
    div.append(button);
  } else if (fieldOptions?.type === 'numberMultiIncrement') {
    let button01 = createIncrementButton(id, 0.1, input, change, fieldOptions, 1);
    div.append(button01);
    let button1 = createIncrementButton(id, 1, input, change, fieldOptions, 1);
    div.append(button1);
    let button10 = createIncrementButton(id, 10, input, change, fieldOptions, 1);
    div.append(button10);
  }

  input.addEventListener('change', function() {
    launchChangeCallback(id, this, fieldOptions, change);
  });

  return div;
}

function createIncrementButton(id: string, increment: number, input: HTMLInputElement, change: (fieldName: string, value: string) => void, fieldOptions: DataFieldOptionsInterface, precision: number =  -1) {
  let button = document.createElement('button');
  if (precision < 0) precision = fieldOptions?.rangeOptions?.step?.split('.').length > 1 && fieldOptions?.rangeOptions?.step?.split('.')[1].length || 0;
  button.innerHTML = `${increment}`;
  button.addEventListener('click', function() {
    this.blur();
    let newValue = parseFloat(input.value) + increment;
    input.value = newValue.toFixed(precision > 20 ? 20 : precision);
    if (input.value.split('.').length > 1 && parseInt(input.value.split('.')[1]) === 0) input.value = input.value.split('.')[0];
    launchChangeCallback(id, input, fieldOptions, change);
  });
  button.style.borderRadius = "7px";
  button.style.border = "0";
  button.style.background = "#888";
  button.style.height = "16px";
  button.style.fontSize = "4";
  button.style.flexGrow = '0';
  button.style.flexShrink = '0';
  button.style.flexBasis = 'auto';
  button.style.marginLeft = "2px";
  button.style.marginRight = "2px";
  return button;
}

function launchChangeCallback(id: string, input: HTMLInputElement, fieldOptions: DataFieldOptionsInterface, change: (fieldName: string, value: string) => void = null) {
  if (fieldOptions?.rangeOptions?.min && parseFloat(input.value) < parseFloat(fieldOptions.rangeOptions.min)) input.value = fieldOptions.rangeOptions.min;
  if (fieldOptions?.rangeOptions?.max && parseFloat(input.value) > parseFloat(fieldOptions.rangeOptions.max)) input.value = fieldOptions.rangeOptions.max;
  if (change) change(id, fieldOptions?.type === "checkbox" ? (input.checked ? '1' : '0') : input.value);
}