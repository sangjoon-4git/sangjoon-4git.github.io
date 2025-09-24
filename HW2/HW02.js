const canavs = document.getElementsById('glCanvas');
const gl = canvas.getContext('webgl2');

function resizeAspectRatio(gl, canvas){
    window.addEventListener('resize', () => {
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        const aspectRatio = originalWidth / originalHeight;

        let newWidth = window.innerWidth;
        let newHeight = window.innerHeight;

        if(newWidth / newHeight > aspectRatio){
            newWidth = newHeight * aspectRatio;
        }
        else{
            newHeight = newWidth / aspectRatio;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    });
}

