// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element 
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 현재 window 전체를 canvas로 사용
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.viewport(0, 0, canvas.width, canvas.height);
gl.enable(gl.SCISSOR_TEST);
gl.clearColor(0.1, 0.2, 0.3, 1.0);

render();

// Render loop
// idea : use scissor, make 4 different Tile -> using for Loop, color each tile.
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);    
    // Draw something here

    const size = canvas.width / 2; //Tiles have same size, 1/2 width height of canvas

    const loc_siz_col = [
        {
            x: 0, y: 0, width: size, height: size, //3
            color: [0.3, 0.3, 1.0, 1.0] //b
        },
        {
            x: 0, y: size, width: size, height: size, //2
            color: [0.3, 1.0, 0.3, 1.0] //g
        },
        {
            x: size, y: 0, width: size, height: size, //4
            color: [1.0, 1.0, 0.3, 1.0] //y
        },
        {
            x: size, y: size, width: size, height: size, //1
            color: [1.0, 0.3, 0.3, 1.0] //r
        }
    ];

    for(let i = 0; i < 4; i++){
        const ren_var = loc_siz_col[i];

        gl.scissor(ren_var.x, ren_var.y, ren_var.width, ren_var.height);

        gl.clearColor(ren_var.color[0], ren_var.color[1], ren_var.color[2], ren_var.color[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.disable(gl.SCISSOR_TEST);
}
// Resize viewport when window size changes
// Idea : if size change, which means size smaller than 500 pixel, make new standard to make square. 
// ratio is 1:1, so width/heigth should be smaller value
window.addEventListener('resize', () => {

    let new_width = Math.min(window.innerWidth, 500);
    let new_height = Math.min(window.innerHeight, 500);

    if (new_width > new_height){ 
        new_width = new_height;
    }
    else{
        new_height = new_width;
    }

    canvas.width = new_width;
    canvas.height = new_height;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.SCISSOR_TEST);
    render(); //Re-Render when 'resize' happen
});
