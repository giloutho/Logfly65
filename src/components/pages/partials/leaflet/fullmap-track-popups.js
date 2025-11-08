export function createPopThermal(feature, layer, gettext) {
    let htmlTable = '<table>'                
    htmlTable += '<tr class="efficiency-highlight"><td>'+gettext('Altitude gain')+'</td><td>'+feature.properties.alt_gain+'m</td></tr>'
    htmlTable += '<tr class="efficiency-highlight"><td>'+gettext('Average climb')+'</td><td>'+feature.properties.avg_climb+'m/s</td></tr>'
    htmlTable += '<tr><td>'+gettext('Maximum climb')+'</td><td>'+feature.properties.max_climb+'m/s</td></tr>'
    htmlTable += '<tr><td>'+gettext('Peak climb')+'</td><td>'+feature.properties.peak_climb+'m/s</td></tr>'
    htmlTable += '<tr><td>'+gettext('Efficiency')+'</td><td>'+feature.properties.efficiency+'%</td></tr>'
    htmlTable += '<tr><td>'+gettext('Start altitude')+'</td><td>'+feature.properties.start_alt+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Finish altitude')+'</td><td>'+feature.properties.finish_alt+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Start time')+'</td><td>'+feature.properties.start_time+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Finish time')+'</td><td>'+feature.properties.finish_time+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Duration')+'</td><td>'+feature.properties.duration+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Accumulated altitude gain')+'</td><td>'+feature.properties.acc_gain+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Accumulated altitude loss')+'</td><td>'+feature.properties.acc_loss+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Drift')+'</td><td>'+feature.properties.drift+'</td></tr>'
    htmlTable += '</table>'
    layer.bindPopup(htmlTable)
}

export function createPopGlide(feature, layer, gettext) {
    let htmlTable = '<table>'
    htmlTable += '<tr class="efficiency-highlight"><td>'+gettext('Distance')+'</td><td>'+feature.properties.distance+'km</td></tr>'
    htmlTable += '<tr class="efficiency-highlight"><td>'+gettext('Average glide ratio')+'</td><td>'+feature.properties.avg_glide+':1</td></tr>'
    htmlTable += '<tr class="efficiency-highlight"><td>'+gettext('Average speed')+'</td><td>'+feature.properties.avg_speed+'km/h</td></tr>'
    htmlTable +='<tr><td>'+gettext('Altitude change')+'</td><td>'+feature.properties.alt_change+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Average descent')+'</td><td>'+feature.properties.avg_descent+'m/s</td></tr>'
    htmlTable += '<tr><td>'+gettext('Start altitude')+'</td><td>'+feature.properties.start_alt+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Finish altitude')+'</td><td>'+feature.properties.finish_alt+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Start time')+'</td><td>'+feature.properties.start_time+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Finish time')+'</td><td>'+feature.properties.finish_time+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Duration')+'</td><td>'+feature.properties.duration+'</td></tr>'
    htmlTable += '<tr><td>'+gettext('Accumulated altitude gain')+'</td><td>'+feature.properties.acc_gain+'m</td></tr>'
    htmlTable += '<tr><td>'+gettext('Accumulated altitude loss')+'</td><td>'+feature.properties.acc_loss+'m</td></tr>'
    htmlTable += '</table>'
    layer.bindPopup(htmlTable)
}