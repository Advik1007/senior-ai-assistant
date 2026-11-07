import torch

print(f"torch version: {torch.__version__}")
print(f"mps available: {torch.backends.mps.is_available()}")
print(f"mps built: {torch.backends.mps.is_built()}")

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"using device: {device}")

x = torch.randn(3, 3, device=device)
y = x @ x.T
print(f"tensor device: {y.device}")
print(f"result:\n{y}")
print("ok")
