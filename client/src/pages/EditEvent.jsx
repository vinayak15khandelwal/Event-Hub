import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEventById, updateEvent } from "../api/events";
import EventForm from "../components/EventForm";
import Spinner from "../components/ui/Spinner";

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
      <div className="flex min-h-[80vh] items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <Spinner /> <span>Loading...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-900 dark:text-slate-100">Event not found.</p>
        <Link to="/organizer" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Edit Event
      </h1>
      <EventForm
        initialValues={event}
        onSubmit={mutation.mutateAsync}
        submitLabel="Save Changes"
      />
    </div>
  );
};

export default EditEvent;
