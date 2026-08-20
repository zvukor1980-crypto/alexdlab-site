#!/bin/zsh
set -e
cd "${0:A:h}"
echo "RepairLab Bridge · Mac Apple Silicon"
echo "Локальное соединение: 127.0.0.1:18473"
/usr/bin/python3 repairlab_bridge.py
