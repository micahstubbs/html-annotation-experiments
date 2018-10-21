function drawAnnotations(selection, data) {
  // Set default x, y position
  data.forEach(d => {
    d.x = d.x || 500;
    d.y = d.y || 250;
  });

  const annotation = selection.selectAll('.annotation')
    .data(data, d => d);

  annotationEnter = annotation.enter().append('div')
    .attr('class', 'annotation')
    .style('left', d => `${d.x}px`)
    .style('top', d => `${d.y}px`)
    .on('mouseenter', mouseenterAnnotation)
    .on('mouseleave', mouseleaveAnnotation);

  annotation
    .style('left', d => `${d.x}px`)
    .style('top', d => `${d.y}px`);

  annotation.exit()
    .remove();

  const content = annotationEnter.append('div')
    .attr('class', 'content')
    .style('width', d => d.width)
    .html(d => d.html);

  const editButton = annotationEnter.append('span')
    .attr('class', 'edit-button fa fa-pencil-square-o')
    .attr('aria-hidden', 'true')
    .classed('hidden', true)
    .on('click', clickEdit);

  const controls = annotationEnter.append('div')
    .attr('class', 'controls')
    .classed('hidden', true);

  const doneButton = controls.append('span')
    .attr('class', 'done-button control fa fa-check')
    .attr('aria-hidden', 'true')
    .on('click', clickDone);

  const deleteButton = controls.append('span')
    .attr('class', 'delete-button control fa fa-trash-o')
    .attr('aria-hidden', 'true')
    .on('click', clickDelete);

  const moveButton = controls.append('span')
    .attr('class', 'move-button control fa fa-arrows')
    .attr('aria-hidden', 'true')
    .call(d3.drag().subject({ x: 0, y: 0 }).on('drag', dragMove));

  const resizeButton = controls.append('span')
    .attr('class', 'resize-button control fa fa-arrows-h')
    .attr('aria-hidden', 'true')
    .call(d3.drag().on('drag', dragResize));

  const textarea = controls.append('textarea')
    .datum({ hidden: false })
    .attr('class', 'control')
    .attr('rows', 4)
    .attr('cols', 30)
    .style('top', function () {
      return `${this.parentNode.clientHeight + 10}px`;
    })
    .html(function (d) {
      const annotation = d3.select(getAncestor(this, 2));
      return annotation.datum().html;
    })
    .on('input', inputTextarea);

  function mouseenterAnnotation() {
    const annotation = d3.select(this);
    const editButton = annotation.select('.edit-button');
    const editable = annotation.datum().editable;
    if (!editable) {
      editButton.classed('hidden', false);
    }
  }

  function mouseleaveAnnotation() {
    const annotation = d3.select(this);
    const editButton = annotation.select('.edit-button');
    editButton.classed('hidden', true);
  }

  function clickEdit() {
    const annotation = d3.select(getAncestor(this, 1));
    const controls = annotation.select('.controls');
    const editButton = d3.select(this);

    controls.classed('hidden', false);
    editButton.classed('hidden', true);
    annotation.datum().editable = true;
    annotation.call(resizeAnnotation);
  }

  function clickDone() {
    const annotation = d3.select(getAncestor(this, 2));
    const controls = annotation.select('.controls');
    controls.classed('hidden', true);
    annotation.datum().editable = false;
  }

  function clickDelete(d) {
    data.splice(data.indexOf(d), 1);
    selection.call(drawAnnotations, data);
  }

  function dragMove(d) {
    const annotation = d3.select(getAncestor(this, 2));
    annotation
    .style('left', `${d.x += d3.event.x}px`)
    .style('top', `${d.y += d3.event.y}px`);
  }

  function dragResize(d) {
    const annotation = d3.select(getAncestor(this, 2));
    const content = annotation.select('.content');
    const width = content.node().clientWidth + d3.event.dx;
    d.width = width;
    content.style('width', d => d.width);
    annotation.call(resizeAnnotation);
  }

  function inputTextarea() {
    const annotation = d3.select(getAncestor(this, 2));
    const content = annotation.select('.content');
    annotation.datum().html = this.value;
    content.html(d => d.html);
    annotation.call(resizeAnnotation);
  }

  function resizeAnnotation(selection) {
    // Move the <textarea> a smidge below the annotation content
    selection.select('textarea.control')
    .style('top', function () {
      return `${this.parentNode.clientHeight + 10}px`;
    });
  }

  function getAncestor(node, level) {
    return level === 0 ? node : getAncestor(node.parentNode, level - 1);
  }
}