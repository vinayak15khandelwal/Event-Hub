import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/events";
import EventForm from "../components/EventForm";

const CreateEvent = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      navigate("/organizer");
    },
  });

  return (
    <div className="min-h-[80vh] bg-slate-950 text-slate-100 p-8">
      <h1 className="mb-4 text-2xl font-semibold">Create Event</h1>
      <EventForm onSubmit={mutation.mutateAsync} submitLabel="Create Event" />
    </div>
  );
};

export default CreateEvent;
