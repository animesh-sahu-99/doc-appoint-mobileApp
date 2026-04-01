import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useGetAppointmentDocumentsQuery, useDeleteAppointmentDocumentMutation } from '../../services/api';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { FileText, FileImage, Trash2, Download } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface DocumentListProps {
  appointmentId: string;
  currentUserId: string; // To check if they can delete it
}

export function DocumentList({ appointmentId, currentUserId }: DocumentListProps) {
  const { data: response, isLoading, refetch } = useGetAppointmentDocumentsQuery(appointmentId);
  const [deleteDoc, { isLoading: isDeleting }] = useDeleteAppointmentDocumentMutation();
  const token = useSelector((state: RootState) => state.auth.token);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const docs = response?.data || [];

  const handleDownloadAndOpen = async (doc: any) => {
    try {
      setDownloadingId(doc.documentId);
      // Sanitize the file name to remove spaces or special characters that crash Android Intents
      const safeFileName = doc.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      // Use CachesDirectoryPath because it's safer for temporary FileProvider intents
      const localPath = `${RNFS.CachesDirectoryPath}/${safeFileName}`;

      // Check if file already exists locally to save bandwidth
      const exists = await RNFS.exists(localPath);
      let downloadedPath = localPath;

      if (!exists) {
        // Download it
        const result = await RNFS.downloadFile({
          fromUrl: doc.downloadUrl,
          toFile: localPath,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).promise;

        if (result.statusCode !== 200) {
          throw new Error(`Failed to download: ${result.statusCode}`);
        }
      }

      // Automatically copy to user's public Downloads folder (Android)
      if (RNFS.DownloadDirectoryPath) {
        const publicPath = `${RNFS.DownloadDirectoryPath}/${safeFileName}`;
        try {
           if (await RNFS.exists(publicPath)) {
               await RNFS.unlink(publicPath);
           }
           await RNFS.copyFile(localPath, publicPath);
           downloadedPath = publicPath;
        } catch (copyErr) {
           console.log('Could not copy to public downloads', copyErr);
        }
      }

      // Try opening it
      try {
        await FileViewer.open(localPath, { showOpenWithDialog: true, showAppsSuggestions: true });
      } catch (viewerErr) {
        // If it still fails, notify the user that it successfully saved to their device!
        Alert.alert('Downloaded Securely', `File was saved to your device: ${safeFileName}`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Could not process the download.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = (documentId: string) => {
    Alert.alert('Delete Document', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteDoc({ documentId }).unwrap();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete Document.');
          }
      }}
    ]);
  };

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />;

  if (docs.length === 0) {
    return (
      <View style={{ paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>No documents uploaded yet.</Text>
      </View>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <View style={{ marginTop: 8, gap: 10 }}>
      {docs.map((doc: any) => {
        const isPdf = doc.fileType?.includes('pdf') || doc.fileName.toLowerCase().endsWith('.pdf');
        const canDelete = doc.uploaderId === currentUserId; // Users can only delete their own docs

        return (
          <View key={doc.documentId} style={{ 
            flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
            padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0'
          }}>
            <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: isPdf ? '#fef2f2' : '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
              {isPdf ? (
                 <FileText size={20} color="#ef4444" />
              ) : (
                 <FileImage size={20} color="#16a34a" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1e293b' }} numberOfLines={1}>{doc.fileName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={{ fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{doc.documentType?.toLowerCase()}</Text>
                <Text style={{ fontSize: 12, color: '#cbd5e1' }}>•</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{formatFileSize(doc.fileSize)}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {downloadingId === doc.documentId ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <TouchableOpacity onPress={() => handleDownloadAndOpen(doc)} style={{ padding: 8 }}>
                  <Download size={18} color={colors.primary} />
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity onPress={() => handleDelete(doc.documentId)} disabled={isDeleting} style={{ padding: 8 }}>
                  <Trash2 size={18} color="#ef4444" opacity={isDeleting ? 0.5 : 1} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
