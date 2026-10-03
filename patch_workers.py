import sys
import re

with open('frontend/src/pages/Workers.tsx', 'r') as f:
    content = f.read()

# Add import
import_str = "import ImportWorkersModal from '../components/ImportWorkersModal';\n"
content = content.replace("import WorkerModal from '../components/WorkerModal';", 
                          "import WorkerModal from '../components/WorkerModal';\n" + import_str)

# Add state for modal
state_str = "  const [isImportModalOpen, setIsImportModalOpen] = useState(false);\n"
content = content.replace("const [isModalOpen, setIsModalOpen] = useState(false);",
                          "const [isModalOpen, setIsModalOpen] = useState(false);\n" + state_str)

# Add Import Data button
btn_str = '''          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded border border-gray-300 shadow-sm transition mr-3"
          >
            Import Data
          </button>
          <button'''
content = content.replace("<button", btn_str, 1) # Only first button replacement (not totally safe but we will restrict it)

# To be safe, let's use re or exact replacement for the button block:
