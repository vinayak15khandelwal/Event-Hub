import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEventById, updateEvent } from "../api/events";
import EventForm from "../components/EventForm";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEventById(id),
  });

  const mutation = useMutation({
    mutationFn: (payload) => updateEvent(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      navigate("/organizer");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-400 p-8">Loading...</div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
        <p>Event not found.</p>
        <Link to="/organizer" className="text-indigo-400 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <h1 className="mb-4 text-2xl font-semibold">Edit Event</h1>
      <EventForm
        initialValues={event}
        onSubmit={mutation.mutateAsync}
        submitLabel="Save Changes"
      />
    </div>
  );
};

export default EditEvent;
