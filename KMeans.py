# CRIME CLUSTERING USING K-MEANS

# -------------------- Importing Dependencies --------------------
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import KernelPCA

# -------------------- Data Loading & Preparation --------------------
crime_data = pd.read_csv('crime.csv')

# Selecting relevant numerical attributes
cols_to_use = [1, 2, 3, 4, 5, 6, 7, 12]
crime_features = crime_data.iloc[:, cols_to_use].values

# Standardizing data for fair clustering
normalizer = StandardScaler()
norm_data = normalizer.fit_transform(crime_features)

# -------------------- Finding Optimal k (Elbow Rule) --------------------
distortions = []
K_range = range(1, 21)

for k in K_range:
    km = KMeans(n_clusters=k, init='k-means++', n_init='auto', random_state=42)
    km.fit(norm_data)
    distortions.append(km.inertia_)

plt.figure(figsize=(8, 5))
plt.plot(K_range, distortions, 'bo--', linewidth=2, markersize=6)
plt.title('Elbow Curve for Optimal Clusters')
plt.xlabel('Number of Clusters (k)')
plt.ylabel('Distortion (Inertia)')
plt.grid(True)
plt.show()

# -------------------- Model Training --------------------
n_clusters = 6
model = KMeans(n_clusters=n_clusters, init='k-means++', n_init='auto', random_state=42)
labels = model.fit_predict(norm_data)

# -------------------- Dimensionality Reduction for Visualization --------------------
pca_mapper = KernelPCA(n_components=2, kernel='rbf', gamma=0.03)
proj_2d = pca_mapper.fit_transform(norm_data)

# -------------------- Cluster Visualization --------------------
cluster_colors = ['red', 'blue', 'green', 'cyan', 'magenta', 'black']
for idx in range(n_clusters):
    plt.scatter(proj_2d[labels == idx, 0], proj_2d[labels == idx, 1], 
                s=90, color=cluster_colors[idx], label=f'Cluster {idx+1}')

# Plot centroids (approximate in reduced space)
centers_approx = pca_mapper.transform(model.cluster_centers_)
plt.scatter(centers_approx[:, 0], centers_approx[:, 1], 
            s=300, c='yellow', edgecolors='black', marker='*', label='Cluster Centers')

plt.title('K-Means Cluster Visualization')
plt.xlabel('Principal Axis 1')
plt.ylabel('Principal Axis 2')
plt.legend()
plt.show()