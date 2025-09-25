const canvas = document.getElementById('glCanvas');
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

function setupText(canvas, initialText, line = 1) {

    if (line == 1) {
        const existingOverlay = document.getElementById('textOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    }

    const overlay = document.createElement('div');
    overlay.id = 'textOverlay';
    overlay.style.position = 'fixed';
    overlay.style.left = canvas.offsetLeft + 10 + 'px';
    overlay.style.top = canvas.offsetTop + (20 * (line - 1) + 10) + 'px';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'monospace';
    overlay.style.fontSize = '14px';
    overlay.style.zIndex = '100';
    overlay.textContent = `${initialText}`;
    
    canvas.parentElement.appendChild(overlay);
    return overlay;
}

async function readShaderFile(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        return `${content}`;
    } catch (error) {
        console.error('Error reading file:', error);
        throw error;
    }
}

class Shader {
    constructor(gl, vertexSource, fragmentSource) {
        this.gl = gl;
        this.program = this.initShader(vertexSource, fragmentSource);
        if (!this.program) {
            throw new Error('Failed to initialize shader program');
        }
    }

    initShader(vertexSource, fragmentSource) {
        // 버텍스 셰이더 컴파일
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexSource);
        this.gl.compileShader(vertexShader);
        
        // 컴파일 결과 확인
        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            console.error('Error compiling vertex shader:', this.gl.getShaderInfoLog(vertexShader));
            this.gl.deleteShader(vertexShader);
            return null;
        }

        // 프래그먼트 셰이더 컴파일
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentSource);
        this.gl.compileShader(fragmentShader);
        
        // 컴파일 결과 확인
        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            console.error('Error compiling fragment shader:', this.gl.getShaderInfoLog(fragmentShader));
            this.gl.deleteShader(fragmentShader);
            return null;
        }

        // 프로그램 생성 및 링크
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        // 링크 결과 확인
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(program));
            this.gl.deleteProgram(program);
            return null;
        }

        // 셰이더 객체 삭제
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);

        return program;
    }

    // use the shader program
    use() {
        if (!this.program) return;
        this.gl.useProgram(this.program);
    }

    // set the attribute pointer
    setAttribPointer(name, size, type, normalized, stride, offset) {
        if (!this.program) return;
        const location = this.gl.getAttribLocation(this.program, name);
        if (location === -1) {
            console.warn(`Attribute ${name} not found in shader program`);
            return;
        }
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    }

    // Uniform setters
    setBool(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value ? 1 : 0);
    }

    setInt(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), value);
    }

    setFloat(name, value) {
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, name), value);
    }

    setVec2(name, x, y) {
        if (y === undefined) {
            this.gl.uniform2fv(this.gl.getUniformLocation(this.program, name), x);
        } else {
            this.gl.uniform2f(this.gl.getUniformLocation(this.program, name), x, y);
        }
    }

    setVec3(name, x, y, z) {
        if (y === undefined) {
            this.gl.uniform3fv(this.gl.getUniformLocation(this.program, name), x);
        } else {
            this.gl.uniform3f(this.gl.getUniformLocation(this.program, name), x, y, z);
        }
    }

    setVec4(name, x, y, z, w) {
        if (y === undefined) {
            this.gl.uniform4fv(this.gl.getUniformLocation(this.program, name), x);
        } else {
            this.gl.uniform4f(this.gl.getUniformLocation(this.program, name), x, y, z, w);
        }
    }

    setMat2(name, mat) {
        this.gl.uniformMatrix2fv(this.gl.getUniformLocation(this.program, name), false, mat);
    }

    setMat3(name, mat) {
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.program, name), false, mat);
    }

    setMat4(name, mat) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.program, name), false, mat);
    }
}


let shader;
let vao;

const keys = {};
let moveX = 0.0;
let moveY = 0.0;

const movement_level = 0.01;
const Boundary_Limit = 0.9

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 600;
    canvas.height = 600;

    resizeAspectRatio(gl, canvas);

    // Initialize WebGL settings
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.2, 0.3, 1.0);
    
    return true;
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('hw2vert.glsl');
    const fragmentShaderSource = await readShaderFile('hw2frag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function setupKeyBoardEvents() {
    window.addEventListener('keydown', (event) => {
        if (event.key == 'ArrowUp' || event.key == 'ArrowDown'|| event.key == 'ArrowLeft' || event.key == 'ArrowRight'){
            keys[event.key] = true;
            event.preventDefault();
        }
    });

    window.addEventListener('keyup', (event) => {
        if (event.key == 'ArrowUp' || event.key == 'ArrowDown'|| event.key == 'ArrowLeft' || event.key == 'ArrowRight'){
            keys[event.key] = false;
            event.preventDefault();
        }
        
    });
}

function setupBuffers() {
    const vertices = new Float32Array([
         0.0,  0.0, 0.0,
        -0.1, -0.1, 0.0,
         0.1, -0.1, 0.0,
         0.1,  0.1, 0.0,
        -0.1,  0.1, 0.0, 
        -0.1, -0.1, 0.0
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    shader.setAttribPointer('aPos', 3, gl.FLOAT, false, 0, 0);
}

function updateMove() {
    let moved = false;

    if(keys['ArrowUp']){
        moveY += movement_level;
        moved = true;
    }

    if (keys['ArrowDown']) {
        moveY -= movement_level;
        moved = true;
    }
    if (keys['ArrowLeft']) {
        moveX -= movement_level;
        moved = true;
    }
    if (keys['ArrowRight']) {
        moveX += movement_level;
        moved = true;
    }
            
    if (moved) {
        moveX = Math.max(-Boundary_Limit, Math.min(Boundary_Limit, moveX));
        moveY = Math.max(-Boundary_Limit, Math.min(Boundary_Limit, moveY));
    }
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
            
    shader.use();
    shader.setVec2('movement', moveX, moveY);
            
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 6); 
}

function loop(){
    updateMove();
    render();
    requestAnimationFrame(loop);
}

async function main() {
    try {

        // WebGL 초기화
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }

        // 셰이더 초기화
        await initShader();

        // setup text overlay (see util.js)
        setupText(canvas, "Use arrow keys to move the rectangle", 1);

        // 키보드 이벤트 설정
        setupKeyBoardEvents();
        
        // 나머지 초기화
        setupBuffers();
        shader.use();
        
        // 렌더링 시작
        loop();

        return true;

    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}

main().then(success => {
    if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
    }
}).catch(error => {
    console.error('프로그램 실행 중 오류 발생:', error);
});