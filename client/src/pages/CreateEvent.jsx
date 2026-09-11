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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Create Event
      </h1>
      <EventForm onSubmit={mutation.mutateAsync} submitLabel="Create Event" />
    </div>
  );
};

export default CreateEvent;
