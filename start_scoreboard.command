#!/bin/zsh
cd "$(dirname "$0")"

if [ ! -x ".venv/bin/python" ]; then
    echo "First-time setup — this only happens once."
    echo "Creating virtual environment..."
    if ! python3 -m venv .venv; then
        echo ""
        echo "Setup failed. Make sure Python 3 is installed:"
        echo "  https://www.python.org/downloads/"
        exit 1
    fi
    echo "Installing dependencies..."
    if ! .venv/bin/python -m pip install --quiet -r requirements.txt; then
        echo ""
        echo "Dependency installation failed."
        echo "Check your internet connection and try again."
        exit 1
    fi
    echo "Done! Starting Upward Scoreboard..."
    echo ""
fi

.venv/bin/python app.py
