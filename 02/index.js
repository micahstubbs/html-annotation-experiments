let annotationData

// setup the page
const width = 960
const height = 960

const margin = { top: 30, left: 30, bottom: 0, right: 0 }

const outerWidth = width + margin.left + margin.right
const outerHeight = height + margin.top + margin.bottom

const container = d3.select('.container')

const canvas = d3
  .select('canvas')
  .attr('width', width)
  .attr('height', height)

const context = canvas.node().getContext('2d')

const legend = d3
  .select('.legend')
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

const xOffset = 15
const yOffset = 9
const annotationsContainer = d3
  .select('.annotations')
  .style('width', width + xOffset)
  .style('height', height + yOffset)

const projection = d3
  .geoSatellite()
  .distance(1.1)
  .scale(5500)
  .rotate([80.0, -30.5, 32.12])
  .center([-5, 10.2])
  .tilt(15)
  .clipAngle((Math.acos(1 / 1.1) * 180) / Math.PI - 1e-6)
  .precision(0.1)

const graticule = d3
  .geoGraticule()
  .extent([[-93, 27], [-47 + 1e-6, 57 + 1e-6]])
  .step([3, 3])

const path = d3
  .geoPath()
  .projection(projection)
  .context(context)
  .pointRadius(3)

const colorDomain = [200, 375]
const color = d3.scaleSequential(d3.interpolatePlasma).domain(colorDomain)

function ready(error, annotations, data) {
  if (error) throw error

  // Want to be able to use `copy(annotationData)` in Chrome console
  annotationData = annotations

  // Draw annotations
  annotationsContainer.call(drawAnnotations, annotations)

  // Draw graticule
  context.beginPath()
  path(graticule())
  context.globalAlpha = 0.4
  context.strokeStyle = '#777'
  context.stroke()

  // Draw voronoi paths
  context.globalAlpha = 0.8
  topojson.feature(data, data.objects.voronoi).features.forEach(feature => {
    context.beginPath()
    path(feature)
    context.fillStyle = color(feature.properties.tmax)
    context.fill()
  })

  // Draw state borders
  context.globalAlpha = 0.8
  context.beginPath()
  path(topojson.mesh(data, data.objects.states, (a, b) => a !== b))
  context.strokeStyle = '#fff'
  context.stroke()

  // Draw cities
  context.beginPath()
  path(data.objects.cities)
  context.globalAlpha = 0.5
  context.strokeStyle = '#000'
  context.stroke()
  context.globalAlpha = 0.3
  context.fillStyle = '#fff'
  context.fill()

  // Draw legend
  function celsiusToFahrenheit(c) {
    return (c * 9) / 5 + 32
  }
  // function fahrenheitToCelsuis(f) { return (f - 32) * 5 / 9; }

  const tickWidth = 20
  const gapWidth = 1

  const ticks = legend
    .selectAll('.tick')
    .data(d3.ticks(colorDomain[1] + 20, colorDomain[0], 10))
    .enter()
    .append('g')
    .attr('class', 'tick')
    .attr('transform', (d, i) => `translate(0,${i * tickWidth + gapWidth})`)

  ticks
    .append('line')
    .attr('x1', 4)
    .attr(
      'transform',
      `translate(${tickWidth - gapWidth},${(tickWidth - gapWidth) / 2})`
    )

  ticks
    .append('text')
    .attr('class', 'stroke-text')
    .attr('dx', `${tickWidth - gapWidth + 6}px`)
    .attr('dy', `${1.2}em`)
    .text(d => `${Math.round(celsiusToFahrenheit(d / 10))}°`)

  ticks
    .append('rect')
    .attr('width', tickWidth - gapWidth)
    .attr('height', tickWidth - gapWidth)
    .style('fill', d => color(d))
    .style('fill-opacity', 0.8)
}

function download(url) {
  document.getElementById('download_iframe').src = url
}

function handleClickPNG() {
  console.log('generating png on the server')
  const pageUrl = window.location.toString()
  const screenshotServerUrl = new URL('https://screenshot.micah.fyi/api/')
  const params = new URLSearchParams(screenshotServerUrl.search)
  params.set('url', pageUrl)
  params.set('id', '6c8d4671-757d-4e23-8b86-d60f2d092e37')
  params.set('ext', 'png')
  screenshotServerUrl.search = params

  // fetch the image from the server
  // then download the image
  // via the browser's normal download UX
  download(screenshotServerUrl)
}

/* implement this next */
//
// function handleClickPDF() {
//   console.log('generating pdf on the server')
// }

d3.queue()
  .defer(d3.json, 'annotations.json')
  .defer(d3.json, 'data.json')
  .await(ready)
