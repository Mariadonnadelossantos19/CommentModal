import React, { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import CommentModal from "./CommentModal"; // Ensure this import is correct

const ProposalTable = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null); // Store selected proposal

  const proposals = [
    {
      id: "CP2025-02-0010",
      date: "4 Feb 2025",
      time: "10:39 AM",
      title: "Innovative Proposal Title",
      duration: "1 Month and 23 Days",
      budget: "₱ 1,231.23",
      leader: "Gerard Balde",
      agency: "NRCP",
      status: "Submitted",
    },
  ];

  const handleAddCommentClick = (proposal) => {
    setSelectedProposal(proposal);
    setModalOpen(true);
  };

  return (
    <div className="container py-5">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h3 className="mb-0 fw-bold text-primary">
          <i className="fas fa-lightbulb me-2"></i>
          Research Proposals
        </h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-pill px-3">
            <i className="fas fa-filter me-2"></i>Filter
          </button>
          <button className="btn btn-primary rounded-pill px-3">
            <i className="fas fa-plus me-2"></i>New Proposal
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-4 py-3 border-0 fw-semibold">Date & Time Submitted</th>
              <th className="px-4 py-3 border-0 fw-semibold">Proposal ID</th>
              <th className="px-4 py-3 border-0 fw-semibold">Title</th>
              <th className="px-4 py-3 border-0 fw-semibold">Duration & Budget</th>
              <th className="px-4 py-3 border-0 fw-semibold">Project Leader</th>
              <th className="px-4 py-3 border-0 fw-semibold">Monitoring Agency</th>
              <th className="px-4 py-3 border-0 fw-semibold">Comment</th>
              <th className="px-4 py-3 border-0 fw-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-4 py-4 text-secondary">
                  <div className="fw-medium">{proposal.date}</div>
                  <small>{proposal.time}</small>
                </td>
                <td className="px-4 py-4">
                  <span className="badge bg-light text-secondary border px-2 py-2">
                    {proposal.id}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="fw-semibold">Project:</div>
                  <div className="text-primary">{proposal.title}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="d-flex align-items-center mb-1">
                    <i className="far fa-calendar-check text-success me-2"></i>
                    <span>{proposal.duration}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-money-bill-wave text-primary me-2"></i>
                    <span className="fw-semibold">{proposal.budget}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle bg-primary bg-opacity-10 text-primary p-2 me-2"
                      style={{
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fas fa-user"></i>
                    </div>
                    <span>{proposal.leader}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="badge bg-info bg-opacity-10 text-info px-3 py-2">
                    {proposal.agency}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2"
                    onClick={() => handleAddCommentClick(proposal)}
                  >
                    <i className="far fa-comment me-2"></i>
                    Add Comment
                  </button>
                </td>
                <td className="px-4 py-4">
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                    <i className="fas fa-paper-plane me-1"></i>
                    {proposal.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center py-3">
        <div>
          <button className="btn btn-sm btn-outline-secondary rounded-circle me-1">
            <i className="fas fa-chevron-left"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary rounded-circle">
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
        <div className="text-muted">
          Showing <span className="fw-medium">1</span> of{" "}
          <span className="fw-medium">{proposals.length}</span> proposals
        </div>
      </div>

      {/* Comment Modal */}
      {isModalOpen && (
        <CommentModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          proposal={selectedProposal} // Pass proposal data to modal
        />
      )}
    </div>
  );
};

export default ProposalTable;
