import request from '../utils/request'

export const uploadPaper = (formData, onUploadProgress) => {
  return request({
    url: '/api/v2/papers',
    method: 'POST',
    data: formData,
    timeout: 300000,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  })
}

export const runPaperJob = (jobId) => {
  return request({
    url: `/api/v2/jobs/${jobId}/run`,
    method: 'POST',
    timeout: 600000
  })
}

export const getPaperJob = (jobId) => {
  return request({
    url: `/api/v2/jobs/${jobId}`,
    method: 'GET'
  })
}

export const downloadPaperJob = (jobId) => {
  return request({
    url: `/api/v2/jobs/${jobId}/download`,
    method: 'GET',
    responseType: 'blob'
  })
}

export const getPapers = (params) => {
  return request({
    url: '/api/v1/papers',
    method: 'GET',
    params
  })
}

export const getPaperById = (id) => {
  return request({
    url: `/api/v1/papers/${id}`,
    method: 'GET'
  })
}

export const getPaperFile = (id) => {
  return request({
    url: `/api/v1/papers/${id}/file`,
    method: 'GET',
    responseType: 'blob'
  })
}

export const getCorrectedFile = (id) => {
  return request({
    url: `/api/v1/papers/${id}/corrected-file`,
    method: 'GET',
    responseType: 'blob'
  })
}

export const getCheckResult = (id) => {
  return request({
    url: `/api/v1/papers/${id}/check-result`,
    method: 'GET'
  })
}

export const parsePaperRequirements = (requirements) => {
  return request({
    url: '/api/v1/paper/parse-format-requirements',
    method: 'POST',
    data: { format_text: requirements }
  })
}

export const getPaperPreview = (id) => {
  return request({
    url: `/api/v1/papers/${id}/preview`,
    method: 'GET'
  })
}

export const getCorrectedPreview = (id) => {
  return request({
    url: `/api/v1/papers/${id}/corrected-preview`,
    method: 'GET'
  })
}

export const applyAllCorrections = (id, payload = {}) => {
  return request({
    url: `/api/v1/paper/${id}/apply-corrections`,
    method: 'POST',
    data: payload
  })
}

export const applySingleCorrection = (paperId, correctionId) => {
  return request({
    url: `/api/v1/papers/${paperId}/corrections/${correctionId}/apply`,
    method: 'POST'
  })
}

export const rejectSingleCorrection = (paperId, correctionId) => {
  return request({
    url: `/api/v1/papers/${paperId}/corrections/${correctionId}/reject`,
    method: 'POST'
  })
}

export const exportCorrectedPaper = (id) => {
  return request({
    url: `/api/v1/papers/${id}/corrected-file`,
    method: 'GET',
    responseType: 'blob'
  })
}

export const getCorrections = (id) => {
  return request({
    url: `/api/v1/papers/${id}/corrections`,
    method: 'GET'
  })
}

export const deletePaper = (id) => {
  return request({
    url: `/api/v1/papers/${id}`,
    method: 'DELETE'
  })
}

export const checkFormat = (id, payload = {}) => {
  return request({
    url: `/api/v1/paper/${id}/check-format`,
    method: 'POST',
    data: payload
  })
}

export const getFormatComparison = (paperId, checkResultId) => {
  return request({
    url: `/api/v1/papers/${paperId}/compare/${checkResultId}`,
    method: 'GET'
  })
}

export const exportCheckReport = (id, params = {}) => {
  return request({
    url: `/api/v1/papers/${id}/export-report`,
    method: 'GET',
    params,
    responseType: 'blob'
  })
}

export const exportCheckReportHtml = (id, params = {}) => {
  return request({
    url: `/api/v1/papers/${id}/export-report-html`,
    method: 'GET',
    params,
    responseType: 'blob'
  })
}

export const fixByTemplate = (paperId, formData) => {
  return request({
    url: `/api/v1/papers/${paperId}/fix/by-template`,
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export const uploadTemplate = (formData, onUploadProgress) => {
  return request({
    url: '/api/paper/upload-template',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  })
}

export const getReviewDiffs = (paperId) =>
  request({
    url: `/api/v1/papers/${paperId}/review-diffs`,
    method: 'GET'
  })

export const applySelectedDiffs = (paperId, acceptedParaIndices) =>
  request({
    url: `/api/v1/papers/${paperId}/apply-diffs`,
    method: 'POST',
    data: { accepted_para_indices: acceptedParaIndices }
  })
