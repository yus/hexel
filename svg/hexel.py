import math
import matplotlib.pyplot as plt
import networkx as nx

# Create graph
G = nx.Graph()

# Parameters
center = (0, 0)
radius = 1.0
num_outer = 6

# Add center vertex
G.add_node('O', pos=center)

# Add outer vertices (hexagon)
angles = [i * math.pi / 3 for i in range(num_outer)]
outer_vertices = []

for i, angle in enumerate(angles):
    x = radius * math.cos(angle)
    y = radius * math.sin(angle)
    vertex_label = chr(65 + i)  # A, B, C, D, E, F
    G.add_node(vertex_label, pos=(x, y))
    outer_vertices.append(vertex_label)

# Add edges: center to outer
for v in outer_vertices:
    G.add_edge('O', v)

# Add edges: outer hexagon
for i in range(num_outer):
    G.add_edge(outer_vertices[i], outer_vertices[(i + 1) % num_outer])

# Get positions
pos = nx.get_node_attributes(G, 'pos')

# Draw
plt.figure(figsize=(8, 8))

# Draw vertices
nx.draw_networkx_nodes(G, pos, node_color=['yellow'] + ['pink']*6, 
                       node_size=500)

# Draw edges
nx.draw_networkx_edges(G, pos, width=2)

# Draw labels
nx.draw_networkx_labels(G, pos, font_size=14, font_weight='bold')

plt.title("Hexagon Graph with Center Vertex")
plt.axis('equal')
plt.axis('off')
plt.tight_layout()

# Save as SVG
plt.savefig("hexagon_graph.svg", format='svg', bbox_inches='tight')
plt.show()

# Print elements
print("Vertices (7):", list(G.nodes))
print("Edges (12):", list(G.edges))
print("\nFaces (6 triangles):")
faces = [('O','A','B'), ('O','B','C'), ('O','C','D'),
         ('O','D','E'), ('O','E','F'), ('O','F','A')]
for i, f in enumerate(faces, 1):
    print(f"Face {i}: {f[0]}-{f[1]}-{f[2]}")
