export default function InspectorWidgetFactory(title: string, content: HTMLDivElement) {
  let div = document.createElement('div');
  div.className = 'inspector__widget--container';

  let titleDiv = document.createElement('div');
  titleDiv.className = 'inspector__widget--title'
  titleDiv.innerText = title;

  div.append(titleDiv);
  div.append(content);
  
  return div;
}