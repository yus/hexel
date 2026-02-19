// static/js/tools/hexagon-tool.js
import { addMessage } from '../ui/messages.js';

export class HexagonTool {
    activate() {
        document.body.style.cursor = 'crosshair';
        addMessage('⬟ Hexagon tool selected (coming soon)', 'info', 2000);
    }
    
    deactivate() {
        document.body.style.cursor = 'default';
    }
    
    onClick(x, y) {
        addMessage('⬟ Hexagon drawing coming in v2!', 'info', 1500);
    }
}
