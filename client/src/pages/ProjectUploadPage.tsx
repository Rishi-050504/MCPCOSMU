import React, { useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FileUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAnalysis } from '../contexts/AnalysisContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import FileUploader from '../components/specific/FileUploader';

const ProjectUploadPage: React.FC = () => {
  const [projectZip, setProjectZip] = useState<File | null>(null);
  const { result, setResult, setError, setIsLoading, setSessionId } = useAnalysis();
  const navigate = useNavigate();

  if (!result || !result.checklist) {
    navigate('/srs-upload');
    return null;
  }

  const handleSetFile = (files: File[]) => {
    if (files.length > 0) setProjectZip(files[0]);
  };

  const removeFile = () => {
    setProjectZip(null);
  };
  
  const handleStartAnalysis = async () => {
    if (!projectZip) return;
    
    setIsLoading(true);
    setError(null);
    setSessionId(null);

    const formData = new FormData();
    formData.append('project', projectZip);
    formData.append('checklist', JSON.stringify(result.checklist));

    try {
      navigate('/analysis');
      const response = await axios.post('http://localhost:3001/api/analyze-code', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
      setSessionId(response.data.sessionId); // Save the session ID
      navigate('/analysis-results');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred during analysis.";
      setError(errorMessage);
      toast.error(errorMessage); // Use toast for error
      navigate('/project-upload');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-3">Step 2: Upload Project</h1>
      <p className="text-center text-secondary mb-5">Upload the .zip file of your project to analyze it against the checklist you just finalized.</p>
      <Row className="justify-content-center">
        <Col lg={8}>
          <FileUploader
            onAddFiles={handleSetFile}
            files={projectZip ? [projectZip] : []}
            removeFile={removeFile}
            acceptedFileTypes={{ 'application/zip': ['.zip'] }}
            maxFileSize={50 * 1024 * 1024}
            multiple={false}
            Icon={FileUp}
          />
        </Col>
      </Row>
      <Row>
        <Col className="text-center mt-5">
          <Button
            className="btn-custom"
            size="lg"
            onClick={handleStartAnalysis}
            disabled={!projectZip}
          >
            Start Analysis <ArrowRight className="ms-2" />
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ProjectUploadPage;